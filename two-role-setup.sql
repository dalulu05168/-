-- Ellery Westcott: administrator + directly managed level2 accounts.
-- Apply in one transaction together with the staff-admin function release.
-- No users or business records are deleted. Former level1 users become level2.
begin;

alter table public.customers alter column level_one_user_id drop not null;

create or replace function public.validate_profile_hierarchy()
returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare p public.profiles; dependent_count bigint;
begin
 if new.role not in ('admin','level2') then raise exception '仅支持管理员与二级账户'; end if;
 if new.role='admin' then
  if new.parent_user_id is not null then raise exception '管理员不能设置上级'; end if;
 else
  select * into p from public.profiles where id=new.parent_user_id;
  if p.role is distinct from 'admin' or p.status='deleted' then raise exception '二级账户必须直属管理员'; end if;
  if new.status='active' and p.status is distinct from 'active' then raise exception '所属管理员未启用'; end if;
 end if;
 if tg_op='UPDATE' and new.status is distinct from old.status and new.status in ('disabled','deleted') then
  if new.role='level2' then
   select count(*) into dependent_count from public.customers where owner_user_id=new.id;
  else
   select count(*) into dependent_count from public.profiles where parent_user_id=new.id and (case when new.status='deleted' then status<>'deleted' else status='active' end);
  end if;
  if dependent_count>0 then raise exception '账户仍有客户或下属账户，请先转移'; end if;
 end if;
 return new;
end;$$;

create or replace function public.validate_customer_hierarchy()
returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare owner public.profiles; manager public.profiles;
begin
 select * into owner from public.profiles where id=new.owner_user_id;
 select * into manager from public.profiles where id=owner.parent_user_id;
 if owner.role is distinct from 'level2' or owner.status is distinct from 'active'
 or manager.role is distinct from 'admin' or manager.status is distinct from 'active' then
  raise exception '客户负责人必须是启用且直属管理员的二级账户';
 end if;
 new.level_one_user_id=null;
 return new;
end;$$;

create or replace function public.sync_level2_customer_hierarchy()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
begin
 if new.role='level2' and new.parent_user_id is distinct from old.parent_user_id then
  update public.customers set level_one_user_id=null where owner_user_id=new.id;
 end if;
 return new;
end;$$;

-- Reparent existing children before retiring the intermediate role.
-- Prevent existing sync/validation triggers from running during this guarded data rewrite.
alter table public.profiles disable trigger user;
alter table public.customers disable trigger user;
update public.profiles child set parent_user_id=parent.parent_user_id
from public.profiles parent where child.role='level2' and child.parent_user_id=parent.id and parent.role='level1';
update public.profiles set role='level2' where role='level1';
update public.customers set level_one_user_id=null where level_one_user_id is not null;
alter table public.profiles enable trigger user;
alter table public.customers enable trigger user;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in ('admin','level2'));
alter table public.profiles drop constraint if exists profile_parent_rule;
alter table public.profiles add constraint profile_parent_rule check((role='admin' and parent_user_id is null) or (role='level2' and parent_user_id is not null));

do $$begin
 if exists(select 1 from public.profiles p left join public.profiles a on a.id=p.parent_user_id
 where p.role='level2' and (a.role is distinct from 'admin' or (p.status='active' and a.status is distinct from 'active'))) then
  raise exception '迁移中止：存在没有有效管理员的二级账户';
 end if;
end;$$;

create or replace function app_private.current_user_role()
returns text language sql stable security definer set search_path=pg_catalog,public,pg_temp as $$
 select role from public.profiles where id=auth.uid() and status='active' and role in ('admin','level2') limit 1;
$$;
create or replace function app_private.can_access_owner(target_owner uuid,target_level_one uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public,pg_temp as $$
 select coalesce(app_private.is_admin() or (app_private.current_user_role()='level2' and target_owner=auth.uid()),false);
$$;
-- Preserve the legacy helper signature for dependent routines, without legacy grants.
create or replace function public.can_access_owner(target_owner uuid,target_level_one uuid)
returns boolean language sql stable security invoker set search_path=pg_catalog,public,pg_temp as $$
 select app_private.can_access_owner(target_owner,target_level_one);
$$;

create or replace function public.can_read_allocation_owner(target_owner uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public,pg_temp as $$
 select exists(select 1 from public.profiles actor join public.profiles owner on owner.id=target_owner
 where actor.id=auth.uid() and actor.status='active' and actor.role in ('admin','level2')
 and owner.role in ('admin','level2')
 and (actor.id=owner.id or (actor.role='admin' and owner.parent_user_id=actor.id and owner.role='level2')));
$$;
revoke all on function public.can_read_allocation_owner(uuid) from public,anon;
grant execute on function public.can_read_allocation_owner(uuid) to authenticated;
revoke all on function public.sync_level2_customer_hierarchy() from public,anon,authenticated;
revoke all on function app_private.current_user_role(),app_private.can_access_owner(uuid,uuid) from public,anon;
grant execute on function app_private.current_user_role(),app_private.can_access_owner(uuid,uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using(
 app_private.current_user_role() in ('admin','level2') and
 (id=auth.uid() or app_private.is_admin() or id=app_private.current_parent_id())
);
drop policy if exists customers_insert on public.customers;
create policy customers_insert on public.customers for insert to authenticated with check(
 level_one_user_id is null and (app_private.is_admin() or (app_private.current_user_role()='level2' and owner_user_id=auth.uid()))
);
-- Explicit ownership in both halves prevents reassignment to a peer.
drop policy if exists customers_update on public.customers;
create policy customers_update on public.customers for update to authenticated
 using(app_private.can_access_owner(owner_user_id,null))
 with check(level_one_user_id is null and app_private.can_access_owner(owner_user_id,null));
commit;

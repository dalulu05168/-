-- Adds a self-service display-name update without permitting role/owner/login changes.
begin;
grant select on public.profiles to authenticated;
grant update(display_name) on public.profiles to authenticated;
create or replace function public.guard_profile_self_name() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if exists(select 1 from public.profiles where id=auth.uid() and role='admin' and status='active') then return new;end if;
 if auth.uid() is distinct from old.id or old.status<>'active' or (to_jsonb(new)-'display_name'-'updated_at') is distinct from (to_jsonb(old)-'display_name'-'updated_at') then raise exception 'Only your display name may be changed';end if;
 if char_length(btrim(new.display_name)) not between 1 and 80 then raise exception 'Display name must contain 1 to 80 characters';end if;
 new.display_name:=btrim(new.display_name);new.updated_at:=now();return new;
end $$;
revoke all on function public.guard_profile_self_name() from public,anon,authenticated;
drop trigger if exists zzz_profile_self_name_guard on public.profiles;
create trigger zzz_profile_self_name_guard before update on public.profiles for each row execute function public.guard_profile_self_name();
drop policy if exists profiles_self_name_update on public.profiles;
create policy profiles_self_name_update on public.profiles for update to authenticated using(id=(select auth.uid()) and status='active') with check(id=(select auth.uid()) and status='active');
commit;

begin;

-- Each account owns exactly three editable project slots. No shared public board.
create table if not exists public.allocation_projects (
 id uuid primary key default gen_random_uuid(),
 owner_user_id uuid not null references public.profiles(id),
 project_number smallint not null check(project_number between 1 and 3),
 name text not null check(char_length(btrim(name)) between 1 and 120),
 symbol text not null default '',
 currency text not null default 'USD' check(currency ~ '^[A-Z]{3}$'),
 total_shares numeric(20,4) not null check(total_shares > 0 and total_shares <> 'NaN'::numeric),
 remaining_shares numeric(20,4) not null check(remaining_shares >= 0 and remaining_shares <= total_shares and remaining_shares <> 'NaN'::numeric),
 board_date date not null default (now() at time zone 'Europe/Bucharest')::date,
 details text not null default '' check(char_length(details)<=4000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(owner_user_id,project_number), unique(id,owner_user_id)
);
create table if not exists public.allocation_reservations (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null,
 owner_user_id uuid not null references public.profiles(id),
 slot_at timestamptz not null,
 reserved_shares numeric(20,4) not null check(reserved_shares>=0 and reserved_shares <> 'NaN'::numeric),
 participant_count integer not null default 0 check(participant_count>=0),
 notes text not null default '' check(char_length(notes)<=2000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(project_id,owner_user_id) references public.allocation_projects(id,owner_user_id),
 unique(project_id,slot_at)
);
create index if not exists allocation_projects_owner on public.allocation_projects(owner_user_id);
create index if not exists allocation_reservations_project_time on public.allocation_reservations(project_id,slot_at);

-- Traverse the actual parent chain, never grant access simply because role = admin.
create or replace function public.can_read_allocation_owner(target_owner uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.profiles where id=auth.uid() and status='active')
 and exists(
   with recursive lineage as (
     select id,parent_user_id,array[id] as visited from public.profiles where id=target_owner
     union all
     select p.id,p.parent_user_id,l.visited||p.id
     from public.profiles p join lineage l on p.id=l.parent_user_id
     where not p.id=any(l.visited)
   ) select 1 from lineage where id=auth.uid()
 );
$$;
revoke all on function public.can_read_allocation_owner(uuid) from public,anon;
grant execute on function public.can_read_allocation_owner(uuid) to authenticated;

alter table public.allocation_projects enable row level security;
alter table public.allocation_reservations enable row level security;
drop policy if exists allocation_projects_read on public.allocation_projects;
create policy allocation_projects_read on public.allocation_projects for select to authenticated using(public.can_read_allocation_owner(owner_user_id));
drop policy if exists allocation_projects_insert on public.allocation_projects;
create policy allocation_projects_insert on public.allocation_projects for insert to authenticated with check(owner_user_id=auth.uid() and public.can_read_allocation_owner(owner_user_id));
drop policy if exists allocation_projects_update on public.allocation_projects;
create policy allocation_projects_update on public.allocation_projects for update to authenticated using(owner_user_id=auth.uid() and public.can_read_allocation_owner(owner_user_id)) with check(owner_user_id=auth.uid() and public.can_read_allocation_owner(owner_user_id));
drop policy if exists allocation_reservations_read on public.allocation_reservations;
create policy allocation_reservations_read on public.allocation_reservations for select to authenticated using(public.can_read_allocation_owner(owner_user_id));
-- Writes use the atomic RPC below; callers cannot bypass capacity checks with REST writes.
revoke all on public.allocation_projects,public.allocation_reservations from anon;
revoke all on public.allocation_projects,public.allocation_reservations from authenticated;
grant select on public.allocation_reservations to authenticated;
grant select,insert,update on public.allocation_projects to authenticated;

create or replace function public.save_allocation_reservation(
 p_project_id uuid,p_slot_at timestamptz,p_reserved_shares numeric,
 p_participant_count integer,p_notes text default '',p_record_id uuid default null
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare project public.allocation_projects; result_id uuid; latest_reserved numeric;
begin
 select * into project from public.allocation_projects where id=p_project_id for update;
 if project.id is null or project.owner_user_id<>auth.uid() or not public.can_read_allocation_owner(project.owner_user_id) then
  raise exception 'Not authorized' using errcode='42501';
 end if;
 if p_reserved_shares is null or p_reserved_shares<0 or p_reserved_shares>project.total_shares
 or p_participant_count is null or p_participant_count<0 or p_slot_at is null
 or (p_slot_at at time zone 'Europe/Bucharest')::date<>project.board_date
 or char_length(coalesce(p_notes,''))>2000 then
  raise exception 'Invalid reservation snapshot' using errcode='22023';
 end if;
 if p_record_id is null then
  insert into public.allocation_reservations(project_id,owner_user_id,slot_at,reserved_shares,participant_count,notes)
  values(project.id,auth.uid(),p_slot_at,p_reserved_shares,p_participant_count,coalesce(p_notes,'')) returning id into result_id;
 else
  update public.allocation_reservations set slot_at=p_slot_at,reserved_shares=p_reserved_shares,
  participant_count=p_participant_count,notes=coalesce(p_notes,''),updated_at=now()
  where id=p_record_id and project_id=project.id and owner_user_id=auth.uid() returning id into result_id;
  if result_id is null then raise exception 'Not authorized' using errcode='42501'; end if;
 end if;
 select reserved_shares into latest_reserved from public.allocation_reservations
 where project_id=project.id and (slot_at at time zone 'Europe/Bucharest')::date=project.board_date
 order by slot_at desc limit 1;
 update public.allocation_projects set remaining_shares=total_shares-latest_reserved,updated_at=now() where id=project.id;
 return result_id;
end;
$$;
revoke all on function public.save_allocation_reservation(uuid,timestamptz,numeric,integer,text,uuid) from public,anon;
grant execute on function public.save_allocation_reservation(uuid,timestamptz,numeric,integer,text,uuid) to authenticated;

-- Preserve the latest existing board for its original creator as Project 1.
insert into public.allocation_projects(owner_user_id,project_number,name,symbol,currency,total_shares,remaining_shares,board_date,details)
select distinct on(created_by) created_by,1,coalesce(nullif(company_name,''),symbol,'项目一'),coalesce(symbol,''),
 case when currency ~ '^[A-Z]{3}$' then currency else 'USD' end,total_shares,remaining_shares,board_date,''
from public.share_boards
where created_by is not null and total_shares>0 and remaining_shares between 0 and total_shares
order by created_by,board_date desc,updated_at desc
on conflict(owner_user_id,project_number) do nothing;

commit;

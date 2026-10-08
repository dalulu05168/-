-- Review and run only on the intended database after the existing allocation migration.
-- This file never inserts test data into public production tables.
begin;
alter table public.allocation_projects add column if not exists customer_ledger_enabled boolean not null default false;
create table if not exists public.allocation_customer_reservations (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null,
 owner_user_id uuid not null references public.profiles(id),
 customer_id bigint not null references public.customers(id),
 reserved_shares numeric(20,4) not null check(reserved_shares>0 and reserved_shares<>'NaN'::numeric),
 status text not null default 'confirmed' check(status in ('pending','confirmed','cancelled')),
 confirmed_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key(project_id,owner_user_id) references public.allocation_projects(id,owner_user_id),
 check((status='confirmed' and confirmed_at is not null) or (status<>'confirmed' and confirmed_at is null))
);
create index if not exists customer_reservations_project on public.allocation_customer_reservations(project_id,status);
alter table public.allocation_customer_reservations enable row level security;
grant select,insert,update,delete on public.allocation_customer_reservations to authenticated;
revoke all on public.allocation_customer_reservations from anon;
drop policy if exists customer_reservations_read on public.allocation_customer_reservations;
create policy customer_reservations_read on public.allocation_customer_reservations for select to authenticated using(public.can_read_allocation_owner(owner_user_id));
drop policy if exists customer_reservations_write on public.allocation_customer_reservations;
create policy customer_reservations_write on public.allocation_customer_reservations for insert to authenticated with check(owner_user_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status='active'));
drop policy if exists customer_reservations_update on public.allocation_customer_reservations;
create policy customer_reservations_update on public.allocation_customer_reservations for update to authenticated using(owner_user_id=(select auth.uid())) with check(owner_user_id=(select auth.uid()));
drop policy if exists customer_reservations_delete on public.allocation_customer_reservations;
create policy customer_reservations_delete on public.allocation_customer_reservations for delete to authenticated using(owner_user_id=(select auth.uid()));
create or replace function public.validate_customer_reservation() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare target uuid;capacity numeric;total numeric;owner uuid;
begin
 target:=case when TG_OP='DELETE' then old.project_id else new.project_id end;
 owner:=case when TG_OP='DELETE' then old.owner_user_id else new.owner_user_id end;
 if owner is distinct from auth.uid() or not exists(select 1 from public.profiles where id=auth.uid() and status='active') then raise exception 'Unauthorized';end if;
 if TG_OP='UPDATE' and (new.owner_user_id<>old.owner_user_id or new.project_id<>old.project_id or new.customer_id<>old.customer_id) then raise exception 'Reservation identity is immutable';end if;
 select total_shares into capacity from public.allocation_projects where id=target and owner_user_id=auth.uid() and customer_ledger_enabled for update;
 if capacity is null then raise exception 'Project unavailable';end if;
 if TG_OP<>'DELETE' and not exists(select 1 from public.customers where id=new.customer_id and owner_user_id=new.owner_user_id) then raise exception 'Customer does not belong to project owner';end if;
 select coalesce(sum(reserved_shares),0) into total from public.allocation_customer_reservations where project_id=target and status='confirmed' and (TG_OP='INSERT' or id<>old.id);
 if TG_OP<>'DELETE' and new.status='confirmed' then total:=total+new.reserved_shares;end if;
 if total>capacity then raise exception 'Project capacity exceeded';end if;
 if TG_OP='DELETE' then return old;else return new;end if;
end $$;
revoke all on function public.validate_customer_reservation() from public,anon,authenticated;
drop trigger if exists validate_customer_reservation on public.allocation_customer_reservations;
create trigger validate_customer_reservation before insert or update or delete on public.allocation_customer_reservations for each row execute function public.validate_customer_reservation();
-- A project update locks the same row as reservation inserts, protecting capacity.
create or replace function public.validate_customer_ledger_capacity() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if old.customer_ledger_enabled and not new.customer_ledger_enabled then raise exception 'Customer ledger cannot be disabled after activation';end if;
 if new.customer_ledger_enabled and new.total_shares<(select coalesce(sum(reserved_shares),0) from public.allocation_customer_reservations where project_id=new.id and status='confirmed') then raise exception 'Project capacity below confirmed customer reservations';end if;
 return new;
end $$;
revoke all on function public.validate_customer_ledger_capacity() from public,anon,authenticated;
drop trigger if exists validate_customer_ledger_capacity on public.allocation_projects;
create trigger validate_customer_ledger_capacity before update on public.allocation_projects for each row execute function public.validate_customer_ledger_capacity();
commit;

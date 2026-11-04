-- Replace the MVP permissive policies and the transition_task stub.
-- Tables, enums, and indexes already exist (20261103142736_mvp_schema).
-- security definer functions live only in private, which is not an exposed schema.
-- Grants for the dashboard role are left untouched.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

drop policy if exists mvp_profiles_authenticated_all on public.profiles;
drop policy if exists mvp_sites_authenticated_all on public.sites;
drop policy if exists mvp_tasks_authenticated_all on public.tasks;
drop policy if exists mvp_task_status_events_authenticated_all on public.task_status_events;

create or replace function private.is_assigner()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'assigner'
  );
$$;

create or replace function private.transition_as(
  p_actor uuid,
  p_task_id uuid,
  p_to_status public.task_status,
  p_comment text,
  p_at timestamptz default null
)
returns public.tasks
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_task public.tasks;
  v_from public.task_status;
  v_role public.user_role;
  v_comment text := nullif(btrim(p_comment), '');
  v_at timestamptz;
  v_edge boolean;
begin
  if p_actor is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- A JWT call cannot pick another actor or timestamp. The seed path has no JWT.
  if auth.uid() is not null and p_actor is distinct from auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_at := case
    when auth.uid() is not null then now()
    else coalesce(p_at, now())
  end;

  select role into v_role
  from public.profiles
  where id = p_actor;

  if v_role is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_task
  from public.tasks
  where id = p_task_id
  for update;

  if not found then
    raise exception 'task_not_found' using errcode = 'P0002';
  end if;

  if v_role = 'executor' and v_task.assignee_id is distinct from p_actor then
    raise exception 'task_not_found' using errcode = 'P0002';
  end if;

  if v_comment is not null and char_length(v_comment) > 2000 then
    raise exception 'comment_too_long' using errcode = '22001';
  end if;

  v_from := v_task.status;
  v_edge :=
    (v_from = 'new' and p_to_status = 'in_progress')
    or (v_from = 'in_progress' and p_to_status = 'in_review')
    or (v_from = 'in_review' and p_to_status in ('accepted', 'rework'))
    or (v_from = 'rework' and p_to_status = 'in_progress');

  if not v_edge then
    raise exception 'illegal_transition' using errcode = 'P0001';
  end if;

  if v_role = 'executor'
     and not (
       (v_from = 'new' and p_to_status = 'in_progress')
       or (v_from = 'in_progress' and p_to_status = 'in_review')
       or (v_from = 'rework' and p_to_status = 'in_progress')
     ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_role = 'assigner'
     and not (
       v_from = 'in_review' and p_to_status in ('accepted', 'rework')
     ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_to_status = 'rework' and v_comment is null then
    raise exception 'comment_required' using errcode = '23514';
  end if;

  perform set_config('app.allow_status_change', '1', true);

  update public.tasks
  set status = p_to_status
  where id = p_task_id
  returning * into v_task;

  insert into public.task_status_events (
    task_id, actor_id, from_status, to_status, comment, created_at
  ) values (
    p_task_id, p_actor, v_from, p_to_status, v_comment, v_at
  );

  return v_task;
end;
$$;

create or replace function public.transition_task(
  p_task_id uuid,
  p_to_status public.task_status,
  p_comment text default null
)
returns public.tasks
language sql
security invoker
set search_path = pg_catalog
as $$
  select private.transition_as(auth.uid(), p_task_id, p_to_status, p_comment, null);
$$;

create or replace function private.seed_transition(
  p_actor uuid,
  p_task_id uuid,
  p_to_status public.task_status,
  p_comment text default null,
  p_at timestamptz default null
)
returns public.tasks
language sql
security definer
set search_path = pg_catalog
as $$
  select private.transition_as(p_actor, p_task_id, p_to_status, p_comment, p_at);
$$;

create or replace function private.guard_task()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_role public.user_role;
begin
  if tg_op = 'INSERT' then
    if new.status is distinct from 'new' then
      raise exception 'task_must_start_new' using errcode = '23514';
    end if;
  else
    if new.id is distinct from old.id
       or new.site_id is distinct from old.site_id
       or new.author_id is distinct from old.author_id
       or new.created_at is distinct from old.created_at then
      raise exception 'immutable_column' using errcode = '42501';
    end if;

    if new.status is distinct from old.status
       and current_setting('app.allow_status_change', true) is distinct from '1' then
      raise exception 'status_change_forbidden' using errcode = '42501';
    end if;
  end if;

  select role into v_role from public.profiles where id = new.author_id;
  if v_role is distinct from 'assigner' then
    raise exception 'author_must_be_assigner' using errcode = '23514';
  end if;

  select role into v_role from public.profiles where id = new.assignee_id;
  if v_role is distinct from 'executor' then
    raise exception 'assignee_must_be_executor' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function private.guard_site()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.id is distinct from old.id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'immutable_column' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function private.record_task_created()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  insert into public.task_status_events (
    task_id, actor_id, from_status, to_status, comment
  ) values (
    new.id, new.author_id, null, 'new', null
  );
  return new;
end;
$$;

create or replace function private.delete_task_events()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  perform set_config('app.cascade_event_task', old.id::text, true);
  delete from public.task_status_events
  where task_id = old.id;
  return old;
end;
$$;

create or replace function private.forbid_event_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'DELETE'
     and old.task_id::text
       is not distinct from current_setting('app.cascade_event_task', true) then
    return old;
  end if;
  raise exception 'event_immutable' using errcode = '42501';
end;
$$;

create or replace function private.protect_profile_role()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.role is distinct from old.role or new.id is distinct from old.id then
    raise exception 'profile_role_immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger tasks_guard
  before insert or update on public.tasks
  for each row
  execute function private.guard_task();

create trigger sites_guard
  before update on public.sites
  for each row
  execute function private.guard_site();

create trigger tasks_record_created
  after insert on public.tasks
  for each row
  execute function private.record_task_created();

create trigger tasks_delete_events
  before delete on public.tasks
  for each row
  execute function private.delete_task_events();

create trigger task_status_events_append_only
  before update or delete on public.task_status_events
  for each row
  execute function private.forbid_event_mutation();

create trigger profiles_protect_role
  before update on public.profiles
  for each row
  execute function private.protect_profile_role();

revoke all on function private.is_assigner() from public, anon;
grant execute on function private.is_assigner() to authenticated;

revoke all on function private.transition_as(uuid, uuid, public.task_status, text, timestamptz)
  from public, anon;
grant execute on function private.transition_as(uuid, uuid, public.task_status, text, timestamptz)
  to authenticated;

revoke all on function public.transition_task(uuid, public.task_status, text)
  from public, anon;
grant execute on function public.transition_task(uuid, public.task_status, text)
  to authenticated;

revoke all on function private.seed_transition(uuid, uuid, public.task_status, text, timestamptz)
  from public, anon, authenticated;

revoke all on function private.guard_task() from public, anon;
grant execute on function private.guard_task() to authenticated;

revoke all on function private.guard_site() from public, anon;
grant execute on function private.guard_site() to authenticated;

revoke all on function private.record_task_created() from public, anon;
grant execute on function private.record_task_created() to authenticated;

revoke all on function private.delete_task_events() from public, anon;
grant execute on function private.delete_task_events() to authenticated;

revoke all on function private.forbid_event_mutation() from public, anon;
grant execute on function private.forbid_event_mutation() to authenticated;

revoke all on function private.protect_profile_role() from public, anon;
grant execute on function private.protect_profile_role() to authenticated;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.sites from anon, authenticated;
revoke all on table public.tasks from anon, authenticated;
revoke all on table public.task_status_events from anon, authenticated;

grant select on table public.profiles to authenticated;

grant select, delete on table public.sites to authenticated;
grant insert (name, address) on table public.sites to authenticated;
grant update (name, address) on table public.sites to authenticated;

grant select, delete on table public.tasks to authenticated;
grant insert (site_id, title, description, assignee_id)
  on table public.tasks to authenticated;
grant update (title, description, assignee_id)
  on table public.tasks to authenticated;

grant select on table public.task_status_events to authenticated;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.sites enable row level security;
alter table public.sites force row level security;
alter table public.tasks enable row level security;
alter table public.tasks force row level security;
alter table public.task_status_events enable row level security;
alter table public.task_status_events force row level security;

create policy profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (true);

create policy sites_select_assigner
  on public.sites
  for select
  to authenticated
  using ((select private.is_assigner()));

create policy sites_select_executor
  on public.sites
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tasks as t
      where t.site_id = sites.id
        and t.assignee_id = (select auth.uid())
    )
  );

create policy sites_insert_assigner
  on public.sites
  for insert
  to authenticated
  with check (
    (select private.is_assigner())
    and created_by = (select auth.uid())
  );

create policy sites_update_assigner
  on public.sites
  for update
  to authenticated
  using ((select private.is_assigner()))
  with check ((select private.is_assigner()));

create policy sites_delete_assigner
  on public.sites
  for delete
  to authenticated
  using ((select private.is_assigner()));

create policy tasks_select_assigner
  on public.tasks
  for select
  to authenticated
  using ((select private.is_assigner()));

create policy tasks_select_executor
  on public.tasks
  for select
  to authenticated
  using (assignee_id = (select auth.uid()));

create policy tasks_insert_assigner
  on public.tasks
  for insert
  to authenticated
  with check (
    (select private.is_assigner())
    and author_id = (select auth.uid())
    and status = 'new'
    and assignee_id <> (select auth.uid())
  );

create policy tasks_update_assigner
  on public.tasks
  for update
  to authenticated
  using ((select private.is_assigner()))
  with check ((select private.is_assigner()));

create policy tasks_delete_assigner
  on public.tasks
  for delete
  to authenticated
  using ((select private.is_assigner()));

create policy task_status_events_select_visible
  on public.task_status_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tasks as t
      where t.id = task_status_events.task_id
    )
  );

notify pgrst, 'reload schema';

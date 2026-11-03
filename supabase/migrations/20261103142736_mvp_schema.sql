-- MVP schema for mini-CRM (light security).
-- TODO(security): replace this pass with the design in database-design.md:
--   private.is_assigner, role-scoped RLS, narrow column grants,
--   guard triggers, append-only task_status_events, and
--   private.transition_as behind public.transition_task.
-- Signed-in clients can CRUD. anon has no table grants and no policies.

create type public.user_role as enum ('assigner', 'executor');

create type public.task_status as enum (
  'new',
  'in_progress',
  'in_review',
  'accepted',
  'rework'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.user_role not null,
  constraint profiles_email_lowercase_chk
    check (email = lower(email) and email ~ '^[^@[:space:]]+@[^@[:space:]]+$'),
  constraint profiles_email_unique unique (email),
  constraint profiles_full_name_chk
    check (char_length(btrim(full_name)) between 1 and 200)
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint sites_name_chk check (char_length(btrim(name)) between 1 and 200),
  constraint sites_address_chk check (char_length(btrim(address)) between 1 and 500)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  title text not null,
  description text not null default '',
  assignee_id uuid not null references public.profiles (id) on delete restrict,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  status public.task_status not null default 'new',
  created_at timestamptz not null default now(),
  constraint tasks_title_chk check (char_length(btrim(title)) between 1 and 200),
  constraint tasks_description_chk check (char_length(description) <= 4000),
  constraint tasks_assignee_is_not_author_chk check (assignee_id <> author_id)
);

create table public.task_status_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  from_status public.task_status,
  to_status public.task_status not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint task_status_events_edge_chk check (
    (from_status is null and to_status = 'new')
    or (from_status = 'new' and to_status = 'in_progress')
    or (from_status = 'in_progress' and to_status = 'in_review')
    or (from_status = 'in_review' and to_status = 'accepted')
    or (from_status = 'in_review' and to_status = 'rework')
    or (from_status = 'rework' and to_status = 'in_progress')
  ),
  constraint task_status_events_comment_chk check (
    (
      to_status <> 'rework'
      and (comment is null or char_length(btrim(comment)) between 1 and 2000)
    )
    or (
      to_status = 'rework'
      and comment is not null
      and char_length(btrim(comment)) between 1 and 2000
    )
  )
);

create index sites_created_by_idx on public.sites (created_by);
create index tasks_site_id_created_at_idx on public.tasks (site_id, created_at desc);
create index tasks_assignee_id_site_id_idx on public.tasks (assignee_id, site_id);
create index tasks_author_id_idx on public.tasks (author_id);
create index task_status_events_task_id_created_at_idx
  on public.task_status_events (task_id, created_at, id);
create index task_status_events_actor_id_idx on public.task_status_events (actor_id);

-- TODO(security): narrow these grants to the column lists in the design.
-- MVP keeps full row CRUD so a demo client can insert profiles, sites,
-- tasks, and history without the private helpers.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.sites from anon, authenticated;
revoke all on table public.tasks from anon, authenticated;
revoke all on table public.task_status_events from anon, authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.sites to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.task_status_events to authenticated;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.sites enable row level security;
alter table public.sites force row level security;
alter table public.tasks enable row level security;
alter table public.tasks force row level security;
alter table public.task_status_events enable row level security;
alter table public.task_status_events force row level security;

-- TODO(security): drop these permissive policies and install the
-- assigner/executor policies from the design. using (true) lets any
-- signed-in user read and write every row.
create policy mvp_profiles_authenticated_all
  on public.profiles
  for all
  to authenticated
  using (true)
  with check (true);

create policy mvp_sites_authenticated_all
  on public.sites
  for all
  to authenticated
  using (true)
  with check (true);

create policy mvp_tasks_authenticated_all
  on public.tasks
  for all
  to authenticated
  using (true)
  with check (true);

create policy mvp_task_status_events_authenticated_all
  on public.task_status_events
  for all
  to authenticated
  using (true)
  with check (true);

-- TODO(security): this stub only updates tasks.status. It does not check
-- the actor role, the status edge, or a rework comment, and it does not
-- insert task_status_events. Replace the body with a call to
-- private.transition_as (security definer, unexposed schema) and keep this
-- wrapper security invoker.
create or replace function public.transition_task(
  p_task_id uuid,
  p_to_status public.task_status,
  p_comment text default null
)
returns public.tasks
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_task public.tasks;
begin
  -- p_comment is accepted so the client signature matches the design.
  -- The MVP stub ignores it.
  perform p_comment;

  update public.tasks
  set status = p_to_status
  where id = p_task_id
  returning * into v_task;

  if not found then
    raise exception 'task_not_found' using errcode = 'P0002';
  end if;

  return v_task;
end;
$$;

revoke all on function public.transition_task(uuid, public.task_status, text)
  from public, anon;
grant execute on function public.transition_task(uuid, public.task_status, text)
  to authenticated;

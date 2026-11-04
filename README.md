# mini-crm

Mini-CRM for construction sites and tasks. A Vite + React + TypeScript single-page app. Screen labels are Russian. An assigner creates, edits, and deletes sites and tasks. An executor sees only their own tasks and the status buttons their role can use. Those buttons call `rpc('transition_task')`. The client never patches `tasks.status`. Postgres enforces the same split with row-level security, narrow column grants, and `private.transition_as` behind that RPC.

Repository: [dvoronin-tech/CRM](https://github.com/dvoronin-tech/CRM).

Production: [https://mini-crm-two-gamma.vercel.app](https://mini-crm-two-gamma.vercel.app).

Hosted Supabase project: [cmhftmlcaxwrqnyyrouq](https://supabase.com/dashboard/project/cmhftmlcaxwrqnyyrouq). API URL: `https://cmhftmlcaxwrqnyyrouq.supabase.co`.

## Requirements

- Node.js 22
- pnpm 10 (see `packageManager` in `package.json`)

## Install

```bash
pnpm install
```

## Environment

```bash
cp .env.example .env.local
```

Set only these two variables. Both are public client values. Do not add a server secret, a `service_role` key, or any password to a `VITE_` variable or to git.

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://cmhftmlcaxwrqnyyrouq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public anon or publishable key from [Project Settings → API keys](https://supabase.com/dashboard/project/cmhftmlcaxwrqnyyrouq/settings/api-keys) |

The shell renders without these values and the login screen explains that the connection is missing. Do not commit `.env.local`.

## Migrations

SQL lives in `supabase/migrations/`, applied in filename order:

1. `supabase/migrations/20261103142736_mvp_schema.sql` — tables, enums, and the first policies.
2. `supabase/migrations/20261103171653_security_rls.sql` — assigner and executor policies, status transitions, and append-only history.

On a fresh database, run both files in the Supabase SQL editor, or use the Supabase CLI against this project. The hosted project `cmhftmlcaxwrqnyyrouq` already has both migrations. There is no seed file in the repository.

## Local development

```bash
pnpm dev
```

Vite prints a local URL (default `http://localhost:5173`).

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm typecheck` | Typecheck the app and Vite config |
| `pnpm lint` | ESLint |
| `pnpm build` | Typecheck and production build |
| `pnpm preview` | Serve the production build |

## Demo accounts

Sign-up is off. Accounts exist only in the Supabase dashboard, each with a matching `profiles` row. Passwords are not stored in this repository. Send them in the hh.ru chat, not in git.

| Role | Email | Name in the UI |
| --- | --- | --- |
| Assigner | `maria.ivanova@example.com` | Иванова Мария |
| Executor | `petr.sokolov@example.com` | Соколов Пётр |
| Executor | `anna.krylova@example.com` | Крылова Анна |

An assigner lands on `/sites`. An executor lands on `/my-tasks`.

## Routes

| Path | Screen |
| --- | --- |
| `/login` | Email and password |
| `/sites` | Site list |
| `/sites/:id` | Site and its tasks |
| `/tasks/:id` | Task, actions, history |
| `/my-tasks` | Tasks for the executor |

`/sites`, `/sites/:id`, `/tasks/:id`, and `/my-tasks` redirect to `/login` when there is no session. After sign-in the app loads `profiles` for the current user. «Мои задачи» selects `tasks` where `assignee_id` is the signed-in user. Task actions call `transition_task`. The function checks the role, the allowed edge, and a rework comment, then writes `tasks.status` and a `task_status_events` row in one transaction. Creating a task also writes the first history row (`from_status` empty, `to_status` `new`).

If the RPC or a guard rejects the action, the screen shows a Russian phrase for the SQL code: `not_authenticated`, `task_not_found`, `forbidden`, `illegal_transition`, `comment_required`, `comment_too_long`, `status_change_forbidden`, `assignee_must_be_executor`, `author_must_be_assigner`, `task_must_start_new`, `immutable_column`, `profile_role_immutable`, `event_immutable`.

`vercel.json` rewrites unknown paths to `index.html` so a refresh on `/sites` or `/tasks/:id` still loads the app. Vercel serves real files (JS, CSS) before that rewrite.

## Deploy

The app is a static Vite build. The Vercel project is `mini-crm`, and the production URL above already has a deployment. Vite reads env at build time, so a new key means a new deploy. Set only these two variables, for Production, Preview, and Development:

- `VITE_SUPABASE_URL` = `https://cmhftmlcaxwrqnyyrouq.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = the public anon or publishable key

Do not set `service_role` on Vercel. Do not put passwords in Vercel env.

From the repository root, after `vercel login`:

```bash
vercel link
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_SUPABASE_URL preview
vercel env add VITE_SUPABASE_ANON_KEY preview
vercel env add VITE_SUPABASE_URL development
vercel env add VITE_SUPABASE_ANON_KEY development
vercel deploy --prod --yes
```

The same names can be set in the Vercel dashboard: Project → Settings → Environment Variables. Then deploy with `vercel deploy --prod --yes`, or push the connected Git branch.

Framework preset: Vite. Install: `pnpm install --frozen-lockfile`. Build: `pnpm build`. Output: `dist`. Node.js 22.

## Row-level security checks

The rules are in `supabase/migrations/20261103171653_security_rls.sql`. Use the anon or publishable key. Do not put a server secret in the client or in this repository.

| Request | Expected result |
| --- | --- |
| `GET /rest/v1/sites` with the anon key and no user JWT | HTTP 401, Postgres `42501` |
| `POST /rest/v1/rpc/transition_task` with no user JWT | `42501` |
| `POST /rest/v1/rpc/transition_as`, `seed_transition`, or `is_assigner` | `404` / `PGRST202` (not in exposed `public`) |
| Executor reads another person's task or a site where they have no task | 0 rows |
| Executor inserts a site or a task | rejected (`42501` or `author_must_be_assigner`) |
| Executor `new` → `accepted`, or any other forbidden edge | `illegal_transition` or `forbidden` |
| Assigner sends a task to rework with an empty comment | `comment_required` |
| `PATCH` that sets `tasks.status` directly | `42501` |
| `POST`, `PATCH`, or `DELETE` on `task_status_events` | `42501` |

In the UI, after migration `security_rls`:

1. **No session.** The checks in the table above.
2. **Executor, list.** Sign in as `petr.sokolov@example.com`. «Мои задачи» shows only that person's tasks. «Объекты» shows only sites where that person has a task. Another executor's task URL says «Задача не найдена». A site with no task for them says «Объект не найден».
3. **Executor, write.** The site screen has no create, edit, or delete buttons. On their own task, the only buttons are the edges for their current status («Взять в работу», «Отправить на проверку», or «Вернуть в работу»). There is no «Принять».
4. **Assigner.** Sign in as `maria.ivanova@example.com`. The site list shows every site, and each site shows every task. Status buttons appear only when the task is «На проверке»: «Принять» and «Вернуть на доработку». Returning without a comment shows «Чтобы вернуть задачу, нужен комментарий».
5. **Direct status write.** `supabase.from('tasks').update({ status: 'accepted' })` is rejected by the typed client. A raw `PATCH` that sets `status` returns `42501`. History `POST`, `PATCH`, and `DELETE` also return `42501`.

SQL editor, as the database owner:

```sql
select n.nspname, p.proname, p.prosecdef
from pg_proc as p
join pg_namespace as n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
order by 1, 2;
```

Security definer (`prosecdef`) is set only on functions in `private`. `public.transition_task` is false. `update public.tasks set status = ...` raises `status_change_forbidden`. `update public.task_status_events` raises `event_immutable`. `update public.profiles set role = ...` raises `profile_role_immutable`. To change a role, drop `profiles_protect_role`, update the row, and create the trigger again.

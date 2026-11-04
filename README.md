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

| Role     | Email                       | Name in the UI |
| -------- | --------------------------- | -------------- |
| Assigner | `maria.ivanova@example.com` | Иванова Мария  |
| Assigner | `gleb.budko@example.com`    | Глеб Будко     |
| Executor | `petr.sokolov@example.com`  | Соколов Пётр   |
| Executor | `anna.krylova@example.com`  | Крылова Анна   |

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

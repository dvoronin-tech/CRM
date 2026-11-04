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

## Demo accounts

Sign-up is off. Accounts exist only in the Supabase dashboard, each with a matching `profiles` row. Passwords are not stored in this repository. Send them in the hh.ru chat, not in git.

| Role     | Email                       | Name in the UI |
| -------- | --------------------------- | -------------- |
| Assigner | `maria.ivanova@example.com` | Иванова Мария  |
| Assigner | `gleb.budko@example.com`    | Глеб Будко     |
| Executor | `petr.sokolov@example.com`  | Соколов Пётр   |
| Executor | `anna.krylova@example.com`  | Крылова Анна   |

An assigner lands on `/sites`. An executor lands on `/my-tasks`.

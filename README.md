# mini-crm

Mini-CRM for construction sites and tasks. The app is a Vite + React + TypeScript SPA. Screen labels are Russian. An assigner creates, edits, and deletes sites and tasks. An executor sees their tasks and only the status buttons their role can use. Those buttons call `transition_task`. Row-level security in this pass is still permissive for any signed-in user, so the screens hide the other role's actions and filter the executor's lists in the client. The database does not enforce that yet, and the status function still only writes `tasks.status`.

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

Set:

- `VITE_SUPABASE_URL` — project URL from the Supabase API settings
- `VITE_SUPABASE_ANON_KEY` — the public anon key

The shell renders without these values and the login screen explains that the connection is missing. Put only the anon or publishable key in `VITE_` variables. Do not commit `.env.local`. There are no seeded users in the repository: sign-in needs accounts created in the Supabase dashboard, plus a matching `profiles` row.

## Run

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

## Routes

| Path | Screen |
| --- | --- |
| `/login` | Email and password |
| `/sites` | Site list |
| `/sites/:id` | Site and its tasks |
| `/tasks/:id` | Task, actions, history |
| `/my-tasks` | Tasks for the executor |

`/sites`, `/sites/:id`, `/tasks/:id`, and `/my-tasks` redirect to `/login` when there is no session. After sign-in the app loads `profiles` for the current user. An executor opens `/my-tasks` and the navigation leads with that screen; an assigner opens `/sites` and only sees that destination. «Мои задачи» selects `tasks` where `assignee_id` is the signed-in user. Task actions call `transition_task`. That SQL function is still a stub: it does not check the role or the allowed edge, it ignores the rework comment, and it does not write `task_status_events`.

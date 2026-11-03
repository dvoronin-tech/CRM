# mini-crm

Mini-CRM for construction sites and tasks. The app is a Vite + React + TypeScript SPA. Screen labels are Russian. Sign-in and the read screens talk to Supabase. Creating sites and tasks is still a stub. Row-level security in this pass is permissive for any signed-in user.

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

`/sites`, `/sites/:id`, `/tasks/:id`, and `/my-tasks` redirect to `/login` when there is no session. After sign-in the app loads `profiles` for the current user. An executor opens `/my-tasks`; an assigner opens `/sites`. «Мои задачи» selects `tasks` where `assignee_id` is the signed-in user. Task actions call `transition_task`; that SQL function is still a stub.

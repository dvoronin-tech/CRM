# mini-crm

UI scaffold for a small CRM of construction sites and tasks. The app is a Vite + React + TypeScript SPA. Screen labels are Russian. Supabase calls, auth guards, and row-level security are not connected yet.

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

The screens render without these values. The client in `src/lib/supabase.ts` reads them on first use. Put only the anon key in `VITE_` variables. Do not commit `.env.local`.

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

`useSession` returns `null`. Navigation shows both role destinations until a profile is loaded. There is no route guard yet.

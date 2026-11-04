# mini-crm

Mini-CRM for construction sites and tasks. The app is a Vite + React + TypeScript SPA. Screen labels are Russian. An assigner creates, edits, and deletes sites and tasks. An executor sees their tasks and only the status buttons their role can use. Those buttons call `rpc('transition_task')`. The client never patches `tasks.status`. Postgres enforces the same split: row-level security, narrow column grants, and `private.transition_as` behind that RPC. A signed-in user who is not an assigner cannot read or change another person's tasks, and history rows cannot be inserted, updated, or deleted through the API.

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

`/sites`, `/sites/:id`, `/tasks/:id`, and `/my-tasks` redirect to `/login` when there is no session. After sign-in the app loads `profiles` for the current user. An executor opens `/my-tasks` and the navigation leads with that screen; an assigner opens `/sites` and only sees that destination. «Мои задачи» selects `tasks` where `assignee_id` is the signed-in user. Task actions call `transition_task`. The function checks the role, the allowed edge, and a rework comment, then writes `tasks.status` and a `task_status_events` row in one transaction. Creating a task also writes the first history row (`from_status` empty, `to_status` `new`).

If the RPC or a guard rejects the action, the screen shows a Russian phrase for the SQL code: `not_authenticated`, `task_not_found`, `forbidden`, `illegal_transition`, `comment_required`, `comment_too_long`, `status_change_forbidden`, `assignee_must_be_executor`, `author_must_be_assigner`, `task_must_start_new`, `immutable_column`, `profile_role_immutable`, `event_immutable`.

## Row-level security checks

Run these against the hosted project after migration `security_rls`. Use the anon or publishable key from the dashboard. Do not put a server secret in the client or in this repository. Demo passwords stay in the dashboard.

1. **No session.** `GET /rest/v1/sites?select=id` with the anon key and no user JWT returns HTTP 401 and Postgres `42501` (`permission denied for table sites`). `POST /rest/v1/rpc/transition_task` with the same key returns `42501` for the function. `POST /rest/v1/rpc/transition_as`, `seed_transition`, and `is_assigner` return `404` / `PGRST202`: those functions are not in the exposed `public` schema.
2. **Executor, list.** Sign in as an executor, for example `petr.sokolov@example.com`. «Мои задачи» shows only that person's tasks. «Объекты» shows only sites where that person has a task. Open another executor's task URL: the screen says «Задача не найдена». Open a site where they have no task: «Объект не найден».
3. **Executor, write.** The site screen has no create, edit, or delete buttons. On their own task, the only buttons are the edges for their current status («Взять в работу», «Отправить на проверку», or «Вернуть в работу»). There is no «Принять». After a successful button, the badge changes and a new history row appears. A second click on an edge that is no longer valid shows «Такой переход статуса недоступен» or «Это действие недоступно вашей роли».
4. **Assigner.** Sign in as `maria.ivanova@example.com`. The site list shows every site, and each site shows every task. Status buttons appear only when the task is «На проверке»: «Принять» and «Вернуть на доработку». Returning without a comment shows «Чтобы вернуть задачу, нужен комментарий». Accepting adds a history row and leaves no further status button. Creating a task adds a history row «— → Новая». Deleting a task or a site removes that history. The delete copy says so.
5. **Direct status write.** From the browser console, `supabase.from('tasks').update({ status: 'accepted' })` is rejected by the typed client. A raw `PATCH` that sets `status` returns `42501`. History `POST`, `PATCH`, and `DELETE` also return `42501`.

SQL editor, as the database owner, to confirm the guards still apply above the API:

```sql
select n.nspname, p.proname, p.prosecdef
from pg_proc as p
join pg_namespace as n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
order by 1, 2;
```

Security definer (`prosecdef`) is set only on functions in `private`. `public.transition_task` is false. `update public.tasks set status = ...` raises `status_change_forbidden`. `update public.task_status_events` raises `event_immutable`. `update public.profiles set role = ...` raises `profile_role_immutable`. To change a role, drop `profiles_protect_role`, update the row, and create the trigger again.

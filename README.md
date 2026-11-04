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

## Run locally

```bash
pnpm dev
```

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

## Как устроена система и защита данных

Это сайт для стройки. Постановщик заводит объекты (стройки) и задачи и назначает исполнителя. Исполнитель видит только свою работу и двигает её по статусам: взял в работу, сдал на проверку. Постановщик принимает задачу или возвращает её на доработку.

Войти можно только по почте и паролю. Кнопки «зарегистрироваться» нет: новых людей с сайта завести нельзя, учётки создают вручную. Пароли в репозиторий не попадают, их передают отдельно в чате.

### Роли

Постановщиков и исполнителей может быть несколько. У каждого человека одна роль. Её записывают при создании учётки, с сайта её не сменить.

Постановщик видит все стройки и все задачи. Он создаёт, правит и удаляет объекты и задачи, назначает исполнителя и закрывает проверку. Вернуть задачу на доработку без комментария нельзя: комментарий остаётся в истории.

Исполнитель видит только свои задачи и только те стройки, где у него есть задача. На карточке стройки чужие задачи ему не показываются.

### Как движется задача

Задача идёт по цепочке. Перескочить шаг нельзя.

1. Постановщик создаёт задачу. Она сразу «Новая».
2. Назначенный исполнитель нажимает «Взять в работу» — задача «В работе».
3. Когда работа готова, он нажимает «Отправить на проверку» — задача «На проверке».
4. Постановщик принимает её («Принята») или возвращает на доработку. Возврат без комментария система не пропускает.
5. С доработки исполнитель снова берёт задачу в работу, и проверка повторяется.

Из «Новой» нельзя сразу сделать «Принята». Из «В работе» нельзя принять задачу, минуя проверку. У принятой задачи кнопок смены статуса нет.

Каждый шаг записывается сам: кто, когда, из какого статуса в какой, и комментарий, если он был. История видна в карточке задачи и постановщику, и исполнителю, которому задача назначена.

### Что показывает экран

После входа постановщик попадает в список объектов. Исполнитель — на экран «Мои задачи».

Кнопки зависят от роли и текущего статуса. У исполнителя на своих задачах только «Взять в работу», «Отправить на проверку» и «Вернуть в работу». Кнопок «Новый объект», «Новая задача», «Изменить», «Удалить», «Принять» и «Вернуть на доработку» у него нет. Если перехода нет, кнопок смены статуса тоже нет.

Человек без учётки остаётся на странице входа.

### Почему те же запреты стоят в базе

Скрытых кнопок мало, если кто-то обойдёт экран и спросит базу напрямую. Те же запреты записаны в самой базе: это правила доступа в базе (в документации — RLS).

Чужую задачу такой запрос не откроет. Стройку, где у исполнителя нет задач, тоже. Запрещённую смену статуса база не пропустит, даже если её отправить вручную, минуя кнопки. Запись истории нельзя подправить или стереть отдельно: её пишет сама система, когда статус меняется. История уходит только вместе с удалённой задачей. Удалить задачу может только постановщик.

Сайт в браузере обращается к базе с публичным ключом приложения (в документации — anon key). Это не пароль. Ключ только позволяет спросить базу от имени вошедшего человека. Что ему можно увидеть и изменить, решают правила его роли. Без входа по почте и паролю задачи не отдаются.

### Чего не может исполнитель

- открыть чужую задачу или стройку, где у него нет задач;
- создать, изменить или удалить объект или задачу;
- принять задачу или вернуть её на доработку;
- перескочить статус, например из «Новой» сразу в «Принята»;
- переписать или стереть историю статусов.

Вложений, уведомлений и поиска нет: тестовое их не просило.

### Короткий словарь

- **RLS** — правила доступа в базе. База сама решает, какие строки этот человек может прочитать или изменить.
- **Anon key** — публичный ключ приложения, не пароль. Он нужен сайту, чтобы обратиться к базе. Сам по себе чужие задачи не открывает.

# Task Board Example

**Learn how to build and test apps with the ORM library — without a real backend.** This example shows a simple task board you can run locally and test fully using the same schema and mock server. Use it as a reference for structuring your own projects so that development and tests share one source of truth and no live server is required.

The app demonstrates **full CRUD for tasks** (create, read, update, delete), **task comments**, and **two user roles** with separate routes and views: **managers** get a team dashboard and task management; **users** get a personal task board and team page. The same ORM schema backs both the in-browser mock API (MSW) and Vitest, so you develop and test against consistent data and behavior.

---

## Tech stack

- **React 18** + **React Router 7** (data APIs: loaders, actions)
- **miragejs-orm** — schema, models, collections, factories, seeds, serializers
- **MSW (Mock Service Worker)** — HTTP interception for dev and tests
- **Vitest** + **Testing Library** — unit and integration tests
- **Vite** — dev server and build
- **Material UI (MUI)** — UI components and theming
- **TypeScript** — end-to-end typing with schema-derived types

---

## Directory structure

### Tests first

All test-related code lives under **`test/`** so you can find it quickly and keep app code separate:

- **`test/schema/`** — ORM schema (models, collections, factories, seeds, serializers). This is the core: it defines your data shape and is used by both the mock server and tests.
- **`test/server/`** — MSW handlers and browser worker setup. Handlers use `testSchema` to serve and mutate data.
- **`test/context/`** — Vitest fixture that injects a fresh `schema` per test and empties data after each test.
- **`test/utils/`** — Test helpers (e.g. `renderApp`, `renderWithRouter`, cookie helpers for auth).

Tests for **API functions** and **feature flows** live next to the code they cover (see below). The **`@test/*`** path alias (e.g. `@test/schema`, `@test/context`, `@test/server`, `@test/utils`) is configured in `tsconfig.json` and used consistently in tests and in `main.tsx` for dev mock server init.

### Features and routes

App code is under **`src/`**, with feature-based folders. Each feature that talks to the API has an **`api/`** subfolder; test files sit beside the modules they test.

| Feature / route area | Path (concept) | What it does | Where tests live |
|----------------------|----------------|--------------|------------------|
| **auth** | `/auth` | Login / logout | `src/features/auth/api/login.test.ts`, `logout.test.ts`, `Login.test.tsx`, `components/LoginForm.test.tsx` |
| **app-layout** | `/` (layout + redirect) | Layout, user loader, role-based redirect | `src/features/app-layout/api/getUser.test.ts`, `AppLayout.test.tsx`, component tests in `components/` |
| **dashboard** (manager) | `/:teamName/dashboard` | Team tasks table, stats, filters | `src/features/dashboard/api/getTeamTasks.test.ts`, `getTaskStatistics.test.ts`, `Dashboard.test.tsx`, and tests under `components/` |
| **user-board** (user) | `/:teamName/users/:userId` | User’s task list by status | `src/features/user-board/api/getUserTasks.test.ts`, `UserBoard.test.tsx`, `components/` |
| **task-details** | `.../tasks/:taskId` or `.../:taskId` | Task view (manager or user context) | `src/features/task-details/api/getTaskDetails.test.ts`, `TaskDetails.test.tsx`, `components/` |
| **task-form** | `.../tasks/:taskId` (form) | Create/update task | `src/features/task-form/api/createTask.test.ts`, `updateTask.test.ts`, `TaskForm.test.tsx`, `components/` |
| **delete-task** | `.../tasks/:taskId/delete` | Delete task | `src/features/delete-task/api/deleteTask.test.ts` |
| **task-comments** | Nested under task details | Load/add comments | `src/features/task-comments/api/getTaskComments.test.ts`, `addTaskComment.test.ts`, `TaskComments.test.tsx`, `components/` |
| **team** (user) | `/:teamName/users/:userId/team` | Team info and members | `src/features/team/api/getTeam.test.ts`, `getTeamMembers.test.ts`, `Team.test.tsx`, `components/` |

Routes and role requirements are defined in **`src/routes.tsx`**: manager routes use `requiresRole: 'MANAGER'`, user routes use `requiresRole: 'USER'`. The same schema backs both.

### Shared and utils

- **`src/shared/`** — Shared types, enums (e.g. `UserRole`, `TaskStatus`, `TaskPriority`), reusable components (e.g. `ErrorBoundary`), and small helpers (e.g. task form defaults, formatting). These are used by features and by the schema (e.g. enums and types for model attrs and JSON).
- They are supporting pieces; the main learning focus is the **schema** and **test/server** setup below.

---

## Schema and setup (recommended pattern)

The **`test/schema/`** folder and how it is wired into the app and tests is the main pattern to copy. It gives you:

1. **One schema** used in development (MSW) and in tests (Vitest).
2. **Typed models and collections** with relationships, factories, and seeds.
3. **Controlled test data**: each test gets a fresh schema instance and an empty DB after the test (via the `test` fixture in `test/context/context.ts`).

### Schema layout

```
test/
  schema/
    schema.ts          # Builds the single schema instance and exports TestSchema / TestCollections
    index.ts           # Re-exports for @test/schema
    models/            # One file per entity: attrs + model() definition
    collections/       # One folder per entity: collection, factory, relations, serializer, seeds
```

- **`schema/schema.ts`**  
  - Calls `schema()` from `miragejs-orm`, registers all collections, sets logging, and calls `.build()`.
  - Exports `testSchema` (the instance), `TestSchema`, and `TestCollections` (for typing collections and factories).

- **`schema/models/`**  
  - Each model file defines **attributes** (e.g. `UserAttrs`, `TaskAttrs`) and builds a **model** with `model().name(...).collection(...).attrs<T>().json<T>().build()`.
  - Models reference shared app types (e.g. `User`, `Task`) for the `.json<T>()` shape so API and UI types stay aligned.

- **`schema/collections/<entity>/`**  
  For each entity (e.g. `users`, `tasks`, `teams`, `comments`):
  - **Collection**: `collection<TestCollections>().model(...).factory(...).relationships(...).serializer(...).seeds(...).build()`.
  - **Relationships**: `relations.belongsTo` / `relations.hasMany` with correct `foreignKey` (and optional `inverse`) so the ORM can traverse associations.
  - **Factory**: `factory<TestCollections>().model(...).attrs({ ... }).traits({ ... })` for creating test data (and optional seed data) with Faker or fixed values.
  - **Serializer**: Default and/or named serializers (e.g. `taskItemSerializer`, `userInfoSerializer`) to control what is returned by the API and in tests.
  - **Seeds**: A `.seeds((schema) => { ... })` function that creates the default dataset. Seed order matters when entities depend on each other (e.g. teams → users → tasks → comments).

### How the schema is used

- **Development**  
  In `src/main.tsx`, when `import.meta.env.DEV` is true, the app calls `initMockServer()` from `@test/server`. That loads seeds with `testSchema.loadSeeds({ onlyDefault: true })` and starts the MSW worker. The same `testSchema` is used by all MSW handlers in `test/server/handlers/` to `find`, `create`, `update`, `delete`, and serialize data. So the app runs against the ORM without a real server.

- **Tests**  
  API and integration tests use the **`test`** fixture from `@test/context`. That fixture provides a **`schema`** argument (the same `testSchema` instance). Tests use it to create data (e.g. `schema.users.create()`, `schema.tasks.create('todo', { ... })`) and assert on results (e.g. `schema.tasks.find(id).toJSON()`). After each test, `testSchema.db.emptyData()` runs so the next test starts clean. MSW handlers are the same ones used in dev, so the same schema backs both.

### Safe pattern summary

1. **Single schema** in `test/schema/schema.ts`, built from models and collections under `test/schema/`.
2. **Path alias** `@test/*` so app and tests import schema and server from `test/` without relative path clutter.
3. **Seeds** only in collections; load them once in dev via `testSchema.loadSeeds({ onlyDefault: true })` in `test/server/browser.ts`.
4. **Test isolation**: use the `test` fixture from `@test/context` so every test gets the same schema and a clean DB after the run.
5. **Handlers** in `test/server/handlers/` use only `testSchema` (and optional serializers from `test/schema/collections/...`) so behavior is consistent between dev and tests.

Following this structure lets you develop and test the task board (and your own apps) against the ORM without a real server, with one place to define and change data shape and behavior.

---

## Scripts

From the `examples/task-board` directory:

- **`pnpm start`** — Start the dev server (mock server with seeds runs in the browser).
- **`pnpm test`** — Run tests once.
- **`pnpm test:watch`** — Run tests in watch mode.
- **`pnpm check:all`** — Lint, type-check, and format check.
- **`pnpm fix:all`** — Auto-fix format and lint issues.

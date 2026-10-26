# Architecture

## Packages

```
apps/web            TanStack Start app: routes, shell, server functions, Effect runtime
packages/db         Drizzle schema + migrations, Effect `Database` service, query functions
packages/auth       Better Auth setup, Effect `Auth` service, roles
packages/shared     Effect Schema contracts, AppError, reusable React components
packages/utils      Helpers used by more than one package
tooling/            Shared tsconfig base
```

Dependencies point one way: `web → auth → db → shared → utils`.

## Core files to add

The template provided no code. Add these files first; the rest of the docs assume they exist.

| File                                            | Responsibility                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `apps/web/src/start.ts`                         | Request middleware (CSRF check, security headers), `AppError` status middleware and serialization |
| `apps/web/src/router.tsx`                       | Router, `QueryClient`, default error and not-found pages                                          |
| `apps/web/src/routes/__root.tsx`                | HTML document and providers                                                                       |
| `apps/web/src/server/runtime.server.ts`         | `AppLive` (all layers merged once), `ManagedRuntime`, `AppServices` type                          |
| `apps/web/src/server/run.server.ts`             | `runServerEffect(program)`                                                                        |
| `apps/web/src/server/request-headers.server.ts` | `RequestHeaders` service                                                                          |
| `apps/web/src/server/validate-input.ts`         | `validateInput(schema)`                                                                           |
| `apps/web/src/server/auth/auth.middleware.ts`   | `authenticatedMiddleware` and role middleware                                                     |
| `packages/db/src/database.ts`                   | `Database` service and `layerFromConfig`                                                          |
| `packages/db/src/errors.ts`                     | `DatabaseError`, `mapDatabaseError`                                                               |
| `packages/auth/src/*`                           | Better Auth instance, `Auth` service with `call` and `getSession`, roles                          |
| `packages/shared/src/errors.ts`                 | `AppError` union                                                                                  |

## How a request runs

0. Request middleware in `apps/web/src/start.ts` runs first: it rejects cross-site server-function calls (CSRF) and sets security headers.
1. A route loader or a component calls a server function, usually through a TanStack Query `queryOptions` in `apps/web/src/integrations/tanstack-query/`.
2. The server function's middleware (for example `authenticatedMiddleware`) reads the session through the `Auth` service and adds `session` and `user` (and tenant data, if the app has tenants) to the context.
3. The validator decodes the input with an Effect Schema through `validateInput(schema)`. Invalid input fails with `InvalidInputError` (HTTP 422) and lists each problem with its field path.
4. The handler returns `runServerEffect(program)`. The program is an `Effect.fn` that reads `Database`, `Auth`, or other services with `yield*`.

   `runServerEffect` copies the request headers before the program starts and provides them as the `RequestHeaders` service. Programs read them with `yield* RequestHeaders`, never with `getRequestHeaders()` or the other request helpers from `@tanstack/react-start/server`. Those helpers read async-local context, and Effect fibers run on a shared scheduler, so inside a program they can return the headers of a different request. Lint rejects those imports in `apps/web/src/server/**`.

5. `runServerEffect` runs the program on the shared `ManagedRuntime`:
   - Success returns the value.
   - An expected `AppError` sets the HTTP status and is thrown as-is. The serialization adapter in `start.ts` encodes it with its schema, so the client receives the same class with `_tag`, `status`, and `message`.
   - Anything else (`DatabaseError`, `AuthError`, defects) is logged at Error level with its full cause and becomes a generic 500.

A server route (`apps/web/src/routes/api/`) runs its program with `runServerRoute(request, program)`, which provides `RequestHeaders` from the request. The program returns a `Response` for every outcome, failures included, and checks the session itself, because server-function middleware does not run for server routes.

## Services and layers

| Service          | Package        | Layer                              | Notes                                                |
| ---------------- | -------------- | ---------------------------------- | ---------------------------------------------------- |
| `Database`       | `@daniel/db`   | `layerFromConfig` (`DATABASE_URL`) | `drizzle-orm/effect-postgres` on `@effect/sql-pg`    |
| `Auth`           | `@daniel/auth` | `layer` (needs `Database`)         | Better Auth instance plus `call` and `getSession`    |
| Observability    | `apps/web`     | `ObservabilityLive`                | Log format and level, optional OTLP export           |
| `RequestHeaders` | `apps/web`     | provided by `runServerEffect`      | The current request's headers                        |
| `PhotoStorage`   | `apps/web`     | `PhotoStorageLive`                 | Gallery files in `PHOTO_STORAGE_DIR`                 |
| `TravelData`     | `apps/web`     | `TravelDataLive` (HTTP client)     | City search, flight and hotel prices (SerpApi)       |
| `InstagramApi`   | `apps/web`     | `InstagramApiLive` (HTTP client)   | Instagram Login, tokens, posts (`docs/instagram.md`) |

To add a service, write a `Context.Service` class with a `layer`, and add it to `AppLive`. Its type flows into `AppServices`, so every server program can use it. Do not call `Effect.provide` inside services.

## Adding a feature: "Reports"

1. **Table.** Add `packages/db/src/schema/reports.ts`, export it from `schema/index.ts`, add its relations to `src/relations.ts`, then run `pnpm db:generate`.
2. **Queries.** Add `packages/db/src/queries/reports.ts`:

   ```ts
   /** Lists the reports of one owner, newest first. */
   export const listReports = Effect.fn("db.listReports")(function* (ownerId: string) {
     const db = yield* Database;

     return yield* db.query.reports.findMany({ where: { ownerId: { eq: ownerId } } });
   }, mapDatabaseError("listReports"));
   ```

   Export it from `packages/db/src/index.ts`. Use `db.transaction((tx) => Effect.gen(...))` for writes that must succeed together.

3. **Contract.** Add input schemas to `packages/shared/src/reports.ts`:

   ```ts
   /** Input for `createReport`. */
   export const CreateReportInput = Schema.Struct({
     title: Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(200)),
   });
   ```

4. **Permissions.** Add the resource and actions to the roles in `packages/auth`.
5. **Server program and function.** In `apps/web/src/server/reports/`:

   ```ts
   // reports.functions.ts
   export const listMyReports = createServerFn({ method: "GET" })
     .middleware([authenticatedMiddleware])
     .handler(({ context }) => runServerEffect(listReports(context.user.id)));

   export const createReport = createServerFn({ method: "POST" })
     .middleware([authenticatedMiddleware])
     .validator(validateInput(CreateReportInput))
     .handler(({ context, data }) => runServerEffect(createReportForUser(context.user.id, data)));
   ```

   A middleware with its own validator passes its output to the function's validator. Such a validator must keep the keys it does not check (`Schema.StructWithRest`); a plain `Schema.Struct` drops them and the function rejects the input with a 422.

   Check permissions in the program and fail with an `AppError` such as `AccessDeniedError`. Wrap mutations with `withAuditEvent`.

6. **Query options.** Add `apps/web/src/integrations/tanstack-query/reports-query-options.ts`.
7. **Route.** Add `apps/web/src/routes/_auth/reports.tsx`. Put the query options in its `context`, prefetch them in its `loader`, and give it a `pendingComponent` (see `docs/client.md`). Put the page components in `apps/web/src/reports/`.
8. **Navigation.** Add an entry to `apps/web/src/shell/navigation.ts`.
9. **Tests.** Add PostgreSQL integration tests for isolation and write rules in `packages/db/tests/integration/`, and authorization tests in `apps/web/tests/integration/`. Run both with `pnpm test:integration`.

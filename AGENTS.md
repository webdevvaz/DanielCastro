# AGENTS.md

This repository is Daniel, a web app built from the structural website template (`B:\Projects\WebSite Template`): a pnpm monorepo with fixed package boundaries, tooling, and coding conventions. Build features inside this structure. `PRODUCT.md` describes the product.

## Package ownership

- `apps/web` owns routes, route-specific components, server functions, the Effect runtime, queries, and application styling.
- `packages/db` owns the Drizzle schema, migrations, the Effect `Database` service, and query functions.
- `packages/auth` owns Better Auth, the Effect `Auth` service, and roles.
- `packages/shared` owns shared React components and Effect Schema contracts, including the `AppError` union.
- `packages/utils` owns helpers used by more than one package.

Dependencies point one way: `web → auth → db → shared → utils`. Each source directory has a `README.md` that says what goes in it.

## Skills and repository tools

Before substantial work:

1. Load the repository's `daniel-impl` skill before you change or review code.
2. Run `vp dlx @tanstack/intent@latest list`, unless the available skills are already present in your context.
3. When one local skill matches the task, load it and follow its `SKILL.md`. Load the most specific skill first.

Run Drizzle Kit through the database workspace and load the matching Drizzle skill from `.agents/skills` first:

```bash
pnpm --filter @daniel/db exec drizzle-kit <command>
```

Effect v4 is a release candidate. Check the installed `.d.ts` files under `node_modules/.pnpm/effect@*/node_modules/effect/dist/` before relying on an API from memory.

Use `pnpm tanstack` (`vp dlx @tanstack/cli@latest`) to read TanStack documentation. Always request JSON output, for example `pnpm tanstack search-docs "server functions" --library start --json`.

## Documentation

Read the matching guide before you change an area, and update it in the same change when behavior or a pattern changes:

- `docs/architecture.md`: server request flow, services, and the feature walkthrough.
- `docs/client.md`: queries, mutations, forms, and error display.
- `docs/security.md`: the authorization layers and the checklist for new server functions.
- `docs/testing.md`: how to write each kind of test.
- `docs/observability.md`: logs, traces, metrics, and audit events.

## Code style

Follow the "Code style" section of `.agents/skills/daniel-impl/SKILL.md`:

- In every file, declare private values first, then exported values, then private types, then exported types. Give every export a `/** ... */` doc comment.
- Separate the logical steps of a function body with blank lines.
- The React Compiler is on. Do not add `useMemo`, `useCallback`, or `React.memo`, except in a component that opts out with `"use no memo"` because a library needs it (for example TanStack Virtual). TanStack Table v9 (`useTable`) needs no opt-out.
- Success is silent: report only errors to the user. Components read query options and `queryClient` from the route context with `useRouteContext`, never by import or `useQueryClient`.
- Do not use conditional spreads in functions and render paths, map over collections instead of indexing into them, and put a helper in its own module once a second file needs it.
- Use `date-fns` for dates, not `Intl` date APIs.
- Log with `Effect.log*` in server code, never `console.log`. See `docs/observability.md`.
- In server programs, read request headers with `yield* RequestHeaders`, never `getRequestHeaders()` or other `@tanstack/react-start/server` request helpers. See `docs/architecture.md`.

## Testing standards

Tests protect important production behavior. They do not exist to increase the test count or coverage percentage. Each test must identify the production risk that it protects and assert an observable state or public contract at the highest practical boundary.

High-value tests cover:

1. Database invariants. Test forbidden operations, tenant isolation, conditional transitions, expected failures, and the guarantee that rejected operations perform no writes.
2. Database reliability. Test transaction atomicity, concurrent operations, race conditions, idempotency, retries, and partial-failure recovery. Coordinate concurrency tests with explicit signals. Timing and sleeps do not prove a race guarantee.
3. Authorization. Test unauthenticated, unauthorized, stale-session, role, ownership, and tenant-boundary cases. Hiding a client control does not test authorization.
4. Schema contracts. Test canonical input, malformed or client-controlled input, conditional fields, bounds, and cross-field rules. Assert the result structure and issue paths, not error-message text.
5. Integration boundaries. Exercise real boundaries between modules or services and verify persisted or externally observable results. Mock only external systems that the test cannot run.
6. Migrations. Add migration tests after the project has a supported upgrade path.
7. Critical client behavior. Test optimistic rollback, command serialization, tenant-safe caches, reconnect behavior, and concurrent mutations when failure could expose stale or cross-tenant data.

Do not add or keep a test only because:

- A component renders, displays text, applies styles, or hides a control.
- A viewport, breakpoint, or layout calculation returns a value already stated in the test.
- A simple unit function returns the value encoded in its test without protecting an important rule.
- A mocked query chain, server wrapper, or callback returns values supplied by its own mocks.
- Coverage would increase.

Apply these rules:

- Prefer a few scenario or table-driven tests over many narrow tests.
- Use real PostgreSQL for database queries, relations, transactions, isolation, and concurrency guarantees. A mocked Drizzle chain cannot test a database invariant.
- Make every regression test fail on the previous defect.
- Use property tests only for pure logic with a broad input space and stable rules.
- Do not repeat a guarantee at a lower boundary unless the lower-level test gives faster diagnosis for a different failure mode.
- Remove a test when it no longer protects important behavior.
- Keep `pnpm test` fast.

Browser and end-to-end tests are deferred until the project is near beta and its main user journeys are stable.

### Test locations and commands

Keep tests outside production `src` directories. Each workspace owns a `tests` directory with boundary folders such as `unit`, `integration`, and `support`.

- `apps/web/tests/unit` contains Vite+ unit tests.
- `apps/web/tests/integration` contains server-boundary tests (authorization, sessions, tenant access) against a real Better Auth instance and a private PostgreSQL cluster.
- `packages/db/tests` contains PostgreSQL integration tests (`@effect/vitest`, one private cluster per suite) and database test support.
- Other packages use `tests/unit` and `tests/integration` when those boundaries apply.

Use these commands:

- `pnpm test` for the fast unit suite while you work.
- `pnpm db:test-application` when a change touches database behavior.
- `pnpm test:integration` when a change touches database behavior, authentication, or authorization.
- `pnpm test:all` for every test boundary.

## Completion requirements

Before you finish a task:

1. Run `pnpm fmt`.
2. Run `pnpm typecheck`.
3. Run `pnpm lint`.
4. Run `pnpm test`.
5. Run `pnpm test:integration` when the change touches database behavior, authentication, or authorization.

Do not report success if a required command finds no tests that it should have found.

## Lint

`pnpm lint` runs the workspace lint configuration in `vite.config.ts`, then the Effect language-service diagnostics for every workspace (`pnpm lint:effect`). Warnings fail the lint command. Use `pnpm quality:fast` to check formatting, types, and lint together.

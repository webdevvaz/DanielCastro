---
name: daniel-impl
description: Apply this repository's implementation and review rules. Use when changing or reviewing application code, tests, dependencies, package boundaries, Effect services, or architecture in this monorepo.
---

# Implementation rules

Make focused changes that fit the current product and the existing codebase. Prefer readable, direct code over compact or speculative designs.

## Communication

Use ASD-STE100 Simplified Technical English in user messages. Use plain, direct English in documentation, comments, and identifiers. Keep established API names and domain terms unchanged.

State important assumptions and tradeoffs. If a rule in this skill conflicts with the user's task, explain the conflict and get approval before you depart from the rule.

## Priorities

Use these priorities when implementation choices compete:

1. Protect authorization boundaries, tenant data, and data integrity.
2. Keep common production behavior reliable and predictable.
3. Meet the current product requirement with the simplest suitable change.
4. Match established repository patterns unless they cause the problem being fixed.
5. Optimize for readability before compactness.

Apply DRY only after duplication is real and stable. Apply YAGNI to possible future requirements, library behavior, and rare cases. Still handle a rare case when failure could expose tenant data, cross an authorization boundary, or cause unrecoverable data loss.

## Package ownership

Keep changes within the package that owns the behavior:

- `apps/web` owns routes, route-specific components, server functions, router state, queries, sessions, and application styling.
- `packages/db` owns database schemas and database functions.
- `packages/auth` owns Better Auth setup.
- `packages/shared` owns reusable React components and shared Effect Schema contracts.
- `packages/utils` owns helpers shared across packages.

Dependencies point one way: `web → auth → db → shared → utils`. Prefer a direct change at an existing boundary. Add a shared module only when reuse already exists or ownership is clear.

## Reuse and derived contracts

Search by behavior and domain terms, not only by the proposed name. Inspect nearby implementations, package exports, and callers before writing another definition. Reuse an equivalent component or helper; extract a shared part when existing callers need the same behavior. Keep a definition local when only one feature owns it. Similar fields alone do not justify a generic factory or a new shared package.

- Derive types from the definition that owns the data: Effect Schema `Type`/`Encoded`, Drizzle select/insert inference, or a query function's return type. Use explicit projections for selected fields and joins. Keep request contracts restricted to fields callers may supply; a table insert type is not an authorization or validation contract.
- Compose schema variants from existing fields or branches. Preserve defaults, optionality, nullability, unknown-key handling, errors, transforms, refinements, and encoded keys.
- Define domain enum values and shared bounds once. Derive other representations from that definition when they describe the same domain. Store a fixed set of values as `text` with `{ enum }` and a check constraint, not as a `pgEnum`: the Postgres driver returns user-defined types as raw bytes. Retain database checks for callers that bypass request validation. Shared schemas must not import database tables.
- Use the domain's ID validator across commands for the same entity. Apply the same slug normalization before storage and lookup, and validate the normalized result. UI normalization does not replace server validation.

Before finishing, check the affected callers for leftover copies and remove definitions made unused by the change.

## Drizzle-managed database changes

Do not create, modify, replace, or delete SQL files in `packages/db/drizzle` unless the user explicitly requests migration-file work. A request to change a Drizzle schema does not authorize migration generation. Complete the schema change, tell the user that a migration is pending, and wait for approval.

When the user requests a migration, load the matching Drizzle skills and generate it with Drizzle Kit. Do not edit generated SQL by hand unless the user explicitly requests a manual SQL change.

Do not install, enable, configure, upgrade, or remove a PostgreSQL extension or another database feature that Drizzle Kit cannot manage unless the user explicitly requests that manual database change. Explain what Drizzle Kit cannot manage and wait for the user's decision.

## Stack conventions

- Reuse a component from `packages/shared` before adding one.
- Add dependency versions to the catalog in `pnpm-workspace.yaml`. Reference them from package manifests with `catalog:`.
- Build forms with `@tanstack/react-form`. Type the default values as the schema's type (`const defaultValues: CreateReportInput = { ... }`). The schema validator then passes `onSubmit` a value of that type, so do not decode it again in `onSubmit`.
- Build tables with `@tanstack/react-table` v9 (`useTable`). Follow the React section below.
- Put shared Effect Schema contracts in `packages/shared` and export them from the package. Do not add Zod.
- Pass schemas to server-function validators with `validateInput(schema)` from `apps/web/src/server/validate-input.ts`, so invalid input becomes `InvalidInputError` (422) with issue paths. Pass schemas to TanStack Form validators and router `validateSearch` with `Schema.toStandardSchemaV1(schema)`.
- Validate path params with an Effect schema inside `params.parse`, and throw `notFound()` when they do not decode. Child routes receive the decoded params.

## Server state and routing

Use TanStack Query for state that comes from server functions. Do not put local UI state in the query cache.

- Put query definitions in `apps/web/src/integrations/tanstack-query/<domain>-query-options.ts` with `queryOptions`, one file per domain.
- Use `useSuspenseQuery` or `useSuspenseQueries` when the first render requires the data. Use `useQuery` or `useQueries` for data that can load after the first render.
- Start route prefetches with `void context.queryClient.query(options).catch(noop)` (`noop` from `@tanstack/react-query`) when the route can stream while the query resolves. Await `context.queryClient.query(...)` only when the loader must inspect its result before routing can continue; add `staleTime: "static"` to reuse cached data of any age. Do not use the deprecated `prefetchQuery`, `ensureQueryData`, or `fetchQuery`.
- Give every route that suspends a `pendingComponent`: one skeleton in the shape of the whole page, header included, in its own small module. Skeletons load with every page, so they import only light parts. Do not wrap parts of the page in `Suspense`; the router wraps a route with a `pendingComponent` in a `Suspense` boundary.
- Put query options in the route context (`context: () => ({ reportsQueryOptions })`). Components read them with `useRouteContext({ from })` or `getRouteApi(id).useRouteContext()`, and read `queryClient` the same way. Do not import query options into components, and do not call `useQueryClient`. Queries that the shell reads on every signed-in page are in the `/_auth` context.
- Wrap Better Auth client requests in TanStack Query and choose cache settings that match the data's lifetime.
- Use `useMutation` for writes and other state-changing requests.

Protect each non-public server function with middleware for its authorization boundary. Treat a function as public only when unauthenticated access is part of the requirement. In client components, wrap mutation functions with `useServerFn`, then call the wrapped function from `useMutation`. Put getter functions inside the `queryFn` of their query options.

## Effect services and server functions

All backend work runs as Effect programs:

- `*.server.ts` holds `Effect.fn("name")(function* () { ... })` programs. They read services with `yield*`: `Database` (`@daniel/db`), `Auth` (`@daniel/auth`), and app services.
- `*.functions.ts` holds `createServerFn` definitions. Each one has middleware, a `validator(validateInput(...))`, and a handler that returns `runServerEffect(program)`.
- Database queries live in `packages/db/src/queries` as `Effect.fn` programs wrapped with `mapDatabaseError`. Use `db.transaction((tx) => Effect.gen(...))` for multi-statement writes.
- Read with relational queries: `db.query.<table>.findMany` and `findFirst`, with `columns`, `where`, and `with` for related rows. Use relation filters for existence checks. Inside a transaction, use `tx.query` the same way. Keep the query builder only where the relational API cannot express the query: row locks (`.for("update")`), aggregates (`count()`), `EXISTS` subqueries composed into a larger filter, and writes.
- Call Better Auth through `auth.call("operation", (api) => api.method({ headers, body }))`. It maps Better Auth errors to `AppError`s.
- Define a new service as a `Context.Service` class with a `layer` constructor, and add the layer to `AppLive` in `apps/web/src/server/runtime.server.ts`. Do not call `Effect.provide` inside services; compose layers at the runtime.
- Wrap audited mutations with `withAuditEvent` from `apps/web/src/server/observability/audit.server.ts`, and add the action name to `AuditAction`. Audit events are structured logs and spans; they are not stored in the database.
- Read request headers with `yield* RequestHeaders` (`apps/web/src/server/request-headers.server.ts`). Never call `getRequestHeaders()`, `getRequest()`, or the cookie helpers inside a server program: Effect fibers share a scheduler, so they can read another request's context. `runServerEffect` is the only place that reads them, and lint enforces this.
- A middleware validator's output becomes the input of the next validator. A middleware validator must keep the keys it does not check (`Schema.StructWithRest(..., [Schema.Record(Schema.String, Schema.Unknown)])`); a plain `Schema.Struct` drops them and the server function rejects the input with a 422.
- Tenant-scoped functions resolve the tenant from the session and the user's membership row; never look up a tenant by a slug or ID from the request alone.
- Do not add `console.log` in server code. Use `Effect.logInfo`/`logWarning`/`logError` with `Effect.annotateLogs`, so output follows `LOG_FORMAT` and reaches the OpenTelemetry exporter.
- Effect v4 is a release candidate. Check the installed `.d.ts` files when an API differs from what you expect.

## Error handling

Use an existing error whenever middleware, a caller, or the UI must distinguish an expected failure. This includes authorization failures, missing resources, invalid client input, and rejected domain transitions. Expected failures are the `Schema.TaggedError` classes in `@daniel/shared/errors` (the `AppError` union). Each has an HTTP `status`. `runServerEffect` sets that status and the client receives the same class, so it can match on `_tag`. Add a new class to the `AppError` union when none has the correct meaning.

Keep cross-package error contracts in `packages/shared`. Keep a tagged error inside its owning package when no other package handles it (for example `DatabaseError`, `AuthError`). Those become a logged 500 at the server boundary. Use a plain `Error` only for programmer errors and impossible states.

## React and client state

- Keep state local with React state when only one component or a small group of nearby components needs it.
- Lift state or use React context when client state must cross a feature's component boundaries. Add a store library only when that is no longer readable.
- Success is silent. The refreshed data, a closed dialog, or a changed control shows that an action worked. Report errors to the user; do not show success notifications.
- Split a component when it mixes distinct responsibilities or becomes hard to scan. Keep route-specific components in the feature directory for that route.

## Code style

### Declaration order

Order the top-level declarations of every `.ts` and `.tsx` file in this sequence, and do not interleave them:

1. Imports (and `export ... from` re-exports).
2. Private values: constants, functions, and components that the file does not export.
3. Exported values, each with a `/** ... */` doc comment. In a route file, `export const Route` belongs here, after its private components.
4. Private types and interfaces.
5. Exported types and interfaces, each with a `/** ... */` doc comment.

```ts
const DEFAULT_LIMIT = 20;

const clampLimit = (limit: number) => {
  return Math.min(limit, DEFAULT_LIMIT);
};

/** Lists reports for an organization, newest first. */
export const listReports = (input: ListReportsInput) => { ... };

type ReportRow = { readonly id: string };

/** Input for `listReports`. */
export type ListReportsInput = { readonly limit: number };
```

Classes (including `Schema.TaggedError` and `Context.Service` classes) and Effect schemas are values. Their derived types (`type Foo = typeof Foo.Type`) go in the type sections. Runtime order wins only when a private value is evaluated at module load and needs an exported value; keep such cases rare.

Extract an inline props type with more than two fields into a named `type ...Props` in the private types section.

### Spacing

Separate the logical steps of a function body with blank lines, so each group does one thing. For example, keep an awaited request and the local state updates it causes in separate groups:

```ts
await queryClient.invalidateQueries({ queryKey: reportQueryKeys.all });

form.reset();
onOpenChange(false);
```

Also put a blank line after variable declarations that precede other statements, around multi-line blocks, and before `return` and `throw`.

In components, put a blank line between groups of hook calls. Keep hooks of one kind together: route and router reads (`useRouteContext`, `useNavigate`, `useSearch`), local state (`useState`, `useRef`), server functions (`useServerFn`), queries, and mutations:

```tsx
const { queryClient } = useRouteContext({ from: "/_auth/reports" });
const navigate = useNavigate();

const [open, setOpen] = useState(false);

const publish = useServerFn(publishReport);

const mutation = useMutation({ ... });
```

### React

The React Compiler is enabled for `apps/web` and `packages/shared`. By default, do not add `useMemo`, `useCallback`, or `React.memo`; the compiler memoizes components and hooks. Keep components pure during render so the compiler can optimize them.

**Exception: libraries the compiler cannot track.** Some hooks return mutable objects or depend on stable references in ways the compiler cannot see, for example TanStack Virtual (`useVirtualizer`) and the TanStack Table v8 API (`useReactTable`). In a component that uses one:

1. Opt the component out of the compiler with the `"use no memo"` directive as the first statement of its body.
2. Use `useMemo` and `useCallback` where the library needs stable references.
3. Add a comment that names the library and the reason.

```tsx
function ReportRows({ rows }: ReportRowsProps) {
  "use no memo"; // TanStack Virtual returns a mutable instance that the React Compiler cannot track.

  const parentRef = useRef<HTMLDivElement>(null);

  const getScrollElement = useCallback(() => parentRef.current, []);

  const virtualizer = useVirtualizer({ count: rows.length, getScrollElement, estimateSize: () => 40 });
  ...
}
```

Keep the opted-out component small, so the rest of the page keeps compiler memoization.

**TanStack Table v9 (`useTable`) works with the compiler** and needs no opt-out:

- Declare `features` (`tableFeatures({ ... })`) and `columns` at module scope, and pass stable `data`. Do not pass a new fallback array such as `data ?? []` on each render; use a module-level empty array.
- Read table state (`getIsSorted()`, `getIsSelected()`, ...) in the component that calls `useTable`, and pass the value to child components as a prop. A child that receives only a header, row, or cell object and reads state from it renders stale values.
- Render cells that depend on changing props in the component that has those props, instead of reading them through `meta` inside a column definition.

### Dates and numbers

Format and calculate dates with `date-fns`. Do not use `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`, or `toLocale*String` for dates. `Intl.NumberFormat` is acceptable for numbers.

Do not do date arithmetic in milliseconds (`Date.now() + 30 * DAY_MS`). Use `addDays`, `subDays`, `differenceInMinutes`, and the other date-fns functions, and name durations in the unit the domain uses (`RETENTION_DAYS`). Pass `{ in: tz("UTC") }` when the result must not move with daylight saving time. A timer or polling interval (`refetchInterval: 30_000`) is a duration, not a date, and can stay in milliseconds.

Format dates in the UI in the viewer's time zone, through one shared component, so server-rendered dates hydrate without a mismatch.

### General

- Prefer type inference. Do not cast to `any` unless an external boundary makes a precise type impossible, and explain the reason in code.
- Model `null` and `undefined` in the type system. Do not add defensive absence checks when the value cannot be absent.
- Do not branch on runtime `typeof`, in tests too. When a value can have two shapes, fix the contract so it has one. At an `unknown` boundary, decode with an Effect schema or use `Predicate` helpers such as `Predicate.hasProperty`.
- Do not use conditional spreads (`...(condition ? [item] : [])`, `...(condition && { key })`) in functions and render paths. Build the value step by step. A module-level constant that is built once when the module loads may use them.
- Map over collections instead of indexing into them. Read an end of a list only on purpose, and give the value a name (`const first = points.at(0)`).
- Put a helper in its own module when more than one file uses it, or when it is not part of the component or route it sits in. Do not copy a helper into a second file, and do not export a helper from a component file.
- Expand dense conditions and control flow. A reader should not need to decode compressed expressions.
- Do not introduce a variable that only renames a short expression.
- Use comments to explain intent, constraints, or a non-obvious decision. Do not narrate the code.
- Avoid regular expressions when string or parser APIs express the rule more clearly.

## Lint and validation

Treat the lint configuration in `vite.config.ts` as authoritative. Run `pnpm quality:fast` while implementing. Run `pnpm lint` when a change adds or substantially changes a TypeScript or React declaration and before completion.

`pnpm lint` runs oxlint and then `pnpm lint:effect`, the Effect language-service diagnostics (`effect-tsgo diagnostics --strict`) for each workspace. Warnings and errors both fail `pnpm lint`. Fix the finding or explain the concrete decision to the user.

Parse external data with the owner-provided Effect schema and infer the TypeScript type from the schema. Do not hand-write structural validation chains.

## Scope and maintainability

Require a concrete reason for added complexity. Valid reasons include an observed defect, a measured bottleneck, a current requirement, or a serious security or data-integrity risk.

A simplification or refactor should reduce code, concepts, dependencies, or operational work. Stop and explain the tradeoff before adding persistence, retries, telemetry, compatibility layers, background work, or a cross-package abstraction to a task that did not require them.

Do not expand a focused task into unrelated architecture or reliability work. Record a low-impact edge case as follow-up work instead of implementing it without evidence.

## Tests and verification

Follow the testing standards in the repository `AGENTS.md`. Add tests for important observable behavior, authorization, data integrity, schema contracts, or a regression that the old code would fail. Do not add tests for styling, simple rendering, or implementation details.

Do not use browser or computer automation unless the user requests it or agrees to it. Do not run a production build after each edit. Run a build only to check behavior that type checking and tests cannot cover, then remove generated `dist` output.

Before finishing, run the checks required by `AGENTS.md`: `pnpm fmt`, `pnpm typecheck`, `pnpm lint`, and `pnpm test`. Run the relevant database or authentication gate when the change touches that boundary.

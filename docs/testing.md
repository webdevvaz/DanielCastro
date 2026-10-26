# Testing

`AGENTS.md` (section Testing standards) says what deserves a test. This guide shows where each kind goes and how to run it.

## Commands

| Command                    | Runs                                                                        | When                                                     |
| -------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------- |
| `pnpm test`                | Unit tests in every package                                                 | While you work; it takes seconds                         |
| `pnpm db:test-application` | Database integration tests (`packages/db/tests/integration`)                | After a change to a query, schema, or migration          |
| `pnpm test:integration`    | Database tests and web server-boundary tests (`apps/web/tests/integration`) | After a change to data, authentication, or authorization |
| `pnpm test:all`            | All of the above                                                            | Before you push                                          |

Run one file with `pnpm --filter web exec vp test run tests/unit/<file>.test.ts`.

The test scripts pass `--passWithNoTests` only so the empty project runs. Remove the flag from a package once it has tests, so a misconfigured path fails instead of passing silently.

## Where tests go

| Boundary                     | Location                         | Tool                                                 |
| ---------------------------- | -------------------------------- | ---------------------------------------------------- |
| Pure logic, schemas, helpers | `<package>/tests/unit/`          | `describe`/`it` from `vite-plus/test`                |
| Database queries             | `packages/db/tests/integration/` | `@effect/vitest` and a private PostgreSQL cluster    |
| Authorization, sessions      | `apps/web/tests/integration/`    | `@effect/vitest`, Better Auth, and a private cluster |

Tests never go inside `src`. Shared test helpers (fixtures, the private cluster) go in `packages/db/tests/support/`.

## The private PostgreSQL cluster

Integration tests do not use the development database. Each test file starts its own PostgreSQL server in a temporary directory, applies the migrations from `packages/db/drizzle`, and deletes everything when the file finishes. It needs `initdb` and `postgres` on `PATH`.

## A database test

```ts
import { layer } from "@effect/vitest";
import { Effect } from "effect";
import { expect } from "vite-plus/test";

import { listReports } from "../../src";
import { insertUsers } from "../support/fixtures";
import { TestDatabaseLive } from "../support/private-postgres";

layer(TestDatabaseLive, { excludeTestServices: true, timeout: "60 seconds" })("reports", (it) => {
  it.effect("lists only the reports of the requested owner", () =>
    Effect.gen(function* () {
      const [owner] = yield* insertUsers(1, "reports");

      // ... create reports for two owners

      const reports = yield* listReports(owner.id);

      expect(reports.map((report) => report.ownerId)).toEqual([owner.id]);
    }),
  );
});
```

- **One cluster per `layer(...)` block.** Tests in the block share the database, so give every row unique values instead of relying on an empty table.
- **`excludeTestServices: true` is required.** Without it, `@effect/vitest` installs a test clock that never advances.
- **Assert the stored state**, not only the return value: after a rejected write, check that nothing was written.

## A server-boundary test

Run the real Better Auth instance on a private cluster. Create users, sign them in to get request headers with a session cookie, and call the same checks the middleware calls. Server functions themselves need a running TanStack Start request, so test the Effect programs and checks behind them, and keep the middleware thin.

Cover these cases for a new protected function: signed out, signed in without the role, signed in with the role, a member of another tenant, and a session whose role changed after sign-in.

## A unit test

```ts
import { CreateReportInput } from "@daniel/shared/reports";
import { Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";

const decode = Schema.decodeUnknownResult(CreateReportInput);

describe("CreateReportInput", () => {
  it.each([
    { name: "a title", input: { title: "Q3" }, ok: true },
    { name: "only spaces", input: { title: "   " }, ok: false },
  ])("$name", ({ input, ok }) => {
    expect(decode(input)._tag).toBe(ok ? "Success" : "Failure");
  });
});
```

Prefer a table of cases over many near-identical tests. Test schemas at their limits and assert the result or the issue path, not the message text.

## A test must be able to fail

Before you keep a regression test, break the code it protects and check that the test fails. A test that still passes against broken code protects nothing.

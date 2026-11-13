import { NodeRuntime } from "@effect/platform-node";
import { migrate } from "drizzle-orm/effect-postgres/migrator";
import { Config, Effect } from "effect";

import { Database, layerFromConfig as DatabaseLive } from "../database";

/** The migration folders; the release image sets `MIGRATIONS_DIR` to its copy. */
const MigrationsDir = Config.String("MIGRATIONS_DIR").pipe(Config.withDefault("drizzle"));

/**
 * Applies pending migrations to `DATABASE_URL`, then exits. The production image runs it before a
 * new version starts (see the `Containerfile`). It records migrations in the same table as
 * `drizzle-kit migrate`, so either one continues where the other stopped.
 */
const migrateDatabase = Effect.gen(function* () {
  const db = yield* Database;
  const migrationsFolder = yield* MigrationsDir;

  yield* migrate(db, { migrationsFolder });

  yield* Effect.log("The database is up to date");
});

NodeRuntime.runMain(migrateDatabase.pipe(Effect.provide(DatabaseLive)));

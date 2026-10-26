import { sql } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "../database";
import { mapDatabaseError } from "../errors";

/** Runs `select 1`, to prove that the pool can reach PostgreSQL. */
export const pingDatabase = Effect.fn("db.pingDatabase")(function* () {
  const db = yield* Database;

  yield* db.execute(sql`select 1`);
}, mapDatabaseError("pingDatabase"));

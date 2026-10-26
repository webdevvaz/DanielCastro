# packages/db/src

| Path           | Holds                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| `index.ts`     | Public exports                                                                               |
| `database.ts`  | The `Database` service (`Context.Service`) and its `layerFromConfig` (`DATABASE_URL`)        |
| `errors.ts`    | `DatabaseError` and `mapDatabaseError(operation)`                                            |
| `schema/`      | One file per table group, re-exported from `schema/index.ts`                                 |
| `relations.ts` | Drizzle relations for the relational query API                                               |
| `queries/`     | One file per domain. Each query is an `Effect.fn("db.name")` wrapped with `mapDatabaseError` |

Migrations live in `../drizzle`. Drizzle Kit generates them; do not edit them by hand.

Use only built-in PostgreSQL column types. `@effect/sql-pg` reads results in the binary format and returns a user-defined type, such as a `pgEnum`, as raw bytes instead of a string. For a fixed set of values, use `text("name", { enum: VALUES })` with a check constraint built from the same list (see `schema/guest-spots.ts`).

import type { DatabaseClient } from "./database";

/** An open transaction, as passed to the `transaction` callback. */
export type DatabaseTransaction = Parameters<Parameters<DatabaseClient["transaction"]>[0]>[0];

/** The database client or an open transaction. Helpers that must join a caller's transaction take this. */
export type DatabaseExecutor = DatabaseClient | DatabaseTransaction;

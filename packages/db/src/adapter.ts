import { drizzle } from "drizzle-orm/node-postgres";

import "./env";
import { relations } from "./relations";

export * as schema from "./schema";

/**
 * A promise-based client for libraries that need one, such as the Better Auth Drizzle adapter.
 * Application code uses the Effect `Database` service instead.
 */
export function makeAdapterDatabase(connectionString: string) {
  return drizzle(connectionString, { relations });
}

/** The promise-based client returned by `makeAdapterDatabase`. */
export type AdapterDatabase = ReturnType<typeof makeAdapterDatabase>;

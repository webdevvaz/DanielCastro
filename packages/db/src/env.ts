import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

// Scripts, Drizzle Kit, and the server all read the repository-root env files.
// Existing process variables win, so CI and production settings are never replaced.
config({ path: [resolve(rootDir, ".env.local"), resolve(rootDir, ".env")], quiet: true });

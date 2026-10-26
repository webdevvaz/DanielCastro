import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ["../../.env.local", "../../.env"], quiet: true });

const url = process.env.DATABASE_URL;

if (!url) throw new Error("DATABASE_URL is required. Copy .env.example to .env.local.");

/** Drizzle Kit configuration for generating and applying migrations. */
export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: { url },
});

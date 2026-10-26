import type { AdapterDatabase } from "@daniel/db/adapter";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { schema } from "@daniel/db/adapter";
import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { admin } from "better-auth/plugins/admin";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Option, Redacted } from "effect";

import type { AuthConfig } from "./config";

/**
 * The only Better Auth HTTP endpoints the browser may call: email sign-in, sign-out, the
 * session, and Better Auth's status and error pages. Accounts are created by
 * `pnpm db:seed-admins`, and any other change goes through server functions that check
 * permissions; the server calls Better Auth through `auth.api`, which this list does not affect.
 *
 * It is an allow list, not a block list: Better Auth has many more endpoints (password and email
 * changes, session revocation, every admin operation), and a plugin or an upgrade can add more.
 */
const browserPaths = new Set(["/sign-in/email", "/sign-out", "/get-session", "/ok", "/error"]);

/**
 * Answers 404 to every HTTP request for an endpoint that is not in `browserPaths`. `onRequest`
 * runs only for HTTP requests, so the server's `auth.api` calls are not affected.
 */
const browserAllowList = {
  id: "daniel-browser-allow-list",
  onRequest: async (request, context) => {
    const basePath = context.options.basePath ?? "/api/auth";
    const { pathname } = new URL(request.url);

    const allowed =
      pathname.startsWith(`${basePath}/`) && browserPaths.has(pathname.slice(basePath.length));

    return allowed ? undefined : { response: new Response("Not Found", { status: 404 }) };
  },
} satisfies BetterAuthPlugin;

/** The Better Auth server: email and password sign-in for the studio team, with admin roles. */
export function makeBetterAuth(config: AuthConfig, database: AdapterDatabase) {
  return betterAuth({
    secret: Redacted.value(config.secret),
    baseURL: config.baseUrl,
    database: drizzleAdapter(database, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      // Visitors never get accounts. `pnpm db:seed-admins` creates the studio team's accounts.
      disableSignUp: true,
    },
    rateLimit: {
      enabled: config.nodeEnv !== "test",
      // Per process. With several replicas, use "database" and generate a migration.
      storage: "memory",
      window: 60,
      max: 100,
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: Option.match(config.ipAddressHeader, {
          onNone: () => undefined,
          onSome: (header) => [header],
        }),
      },
    },
    plugins: [browserAllowList, admin(), tanstackStartCookies()],
  });
}

/** The configured Better Auth server instance. */
export type BetterAuth = ReturnType<typeof makeBetterAuth>;

/** A Better Auth session with its user. */
export type AuthSession = BetterAuth["$Infer"]["Session"];

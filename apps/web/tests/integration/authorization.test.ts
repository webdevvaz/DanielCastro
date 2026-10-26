import { Auth, layer as AuthLayer } from "@daniel/auth";
import { TestDatabaseLive, TestDatabaseUrl } from "@daniel/db/testing";
import { AccessDeniedError } from "@daniel/shared/errors";
import { layer } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { expect } from "vite-plus/test";

import { requireAdmin } from "../../src/server/auth/session.server";

const BASE_URL = "http://localhost:3000";

const PASSWORD = "DanielTest1!";

/** Better Auth settings for the test cluster, instead of the developer's `.env.local`. */
const TestConfigLive = Layer.unwrap(
  Effect.gen(function* () {
    const databaseUrl = yield* TestDatabaseUrl;

    return ConfigProvider.layer(
      ConfigProvider.fromUnknown({
        BETTER_AUTH_SECRET: "integration-test-secret-with-32-characters",
        BETTER_AUTH_URL: BASE_URL,
        DATABASE_URL: databaseUrl,
        NODE_ENV: "test",
      }),
    );
  }),
);

const TestAppLive = AuthLayer.pipe(
  Layer.provide(TestConfigLive),
  Layer.provideMerge(TestDatabaseLive),
);

/** Creates a user through Better Auth, as `pnpm db:seed-admins` does. */
const createUser = Effect.fn("test.createUser")(function* (label: string, role: "user" | "admin") {
  const auth = yield* Auth;

  const email = `${label}-${crypto.randomUUID()}@example.test`;

  const { user } = yield* Effect.promise(() =>
    auth.instance.api.createUser({ body: { email, password: PASSWORD, name: label, role } }),
  );

  return { id: user.id, email };
});

/** Signs in with email and password and returns request headers carrying the session cookie. */
const signIn = Effect.fn("test.signIn")(function* (email: string) {
  const auth = yield* Auth;

  const response = yield* Effect.promise(() =>
    auth.instance.api.signInEmail({ body: { email, password: PASSWORD }, asResponse: true }),
  );

  const cookie = response.headers
    .getSetCookie()
    .map((header) => header.split(";")[0])
    .join("; ");

  return new Headers({ cookie, origin: BASE_URL });
});

/** The session for these headers, failing the test when Better Auth returns none. */
const requireTestSession = Effect.fn("test.requireTestSession")(function* (headers: Headers) {
  const auth = yield* Auth;

  const session = yield* auth.getSession(headers);

  if (!session) return yield* Effect.die("Expected a signed-in session");

  return session;
});

/**
 * Authorization at the server boundary, with a real Better Auth instance on a private PostgreSQL
 * cluster. Admin server functions reach these checks through `adminMiddleware`; the middleware
 * only adds the request headers.
 */
layer(TestAppLive, { excludeTestServices: true, timeout: "120 seconds" })("authorization", (it) => {
  it.effect("admits only admins to admin functions", () =>
    Effect.gen(function* () {
      const admin = yield* createUser("admin", "admin");
      const user = yield* createUser("user", "user");

      const adminSession = yield* requireTestSession(yield* signIn(admin.email));
      const userSession = yield* requireTestSession(yield* signIn(user.email));

      yield* requireAdmin(adminSession.user.role);

      const denied = yield* Effect.flip(requireAdmin(userSession.user.role));

      expect(denied).toBeInstanceOf(AccessDeniedError);
    }),
  );

  it.effect("finds no session for a request without the cookie or with a forged one", () =>
    Effect.gen(function* () {
      const auth = yield* Auth;

      const signedOut = yield* auth.getSession(new Headers({ origin: BASE_URL }));
      const forged = yield* auth.getSession(
        new Headers({ cookie: "better-auth.session_token=forged.value", origin: BASE_URL }),
      );

      expect(signedOut).toBeNull();
      expect(forged).toBeNull();
    }),
  );

  it.effect("ends the session of a user banned after sign-in", () =>
    Effect.gen(function* () {
      const auth = yield* Auth;

      const admin = yield* createUser("ban-admin", "admin");
      const target = yield* createUser("ban-target", "admin");

      const adminHeaders = yield* signIn(admin.email);
      const targetHeaders = yield* signIn(target.email);

      yield* requireTestSession(targetHeaders);

      yield* auth.call("banUser", (api) =>
        api.banUser({ headers: adminHeaders, body: { userId: target.id } }),
      );

      expect(yield* auth.getSession(targetHeaders)).toBeNull();
    }),
  );
});

import type { AppError } from "@daniel/shared/errors";

import { makeAdapterDatabase } from "@daniel/db/adapter";
import { Context, Effect, Layer, Redacted } from "effect";

import { makeBetterAuth, type AuthSession, type BetterAuth } from "./better-auth";
import { AuthConfig } from "./config";
import { toAuthFailure, type AuthError } from "./errors";

const makeAuth = Effect.gen(function* () {
  const config = yield* AuthConfig;

  // Better Auth needs a promise-based Drizzle client. It gets its own small pool, closed with the layer.
  const adapterDatabase = yield* Effect.acquireRelease(
    Effect.sync(() => makeAdapterDatabase(Redacted.value(config.databaseUrl))),
    (database) => Effect.promise(() => database.$client.end()),
  );

  const instance = makeBetterAuth(config, adapterDatabase);

  const call: AuthService["call"] = (operation, f) =>
    Effect.tryPromise({
      try: () => f(instance.api),
      catch: (cause) => toAuthFailure(operation, cause),
    }).pipe(Effect.withSpan(`auth.${operation}`));

  return Auth.of({
    instance,
    call,
    getSession: (headers) => call("getSession", (api) => api.getSession({ headers })),
  });
});

/** Better Auth, with Effect wrappers for its API. */
export class Auth extends Context.Service<Auth, AuthService>()("@daniel/auth/Auth") {}

/** Reads its settings from the environment through `AuthConfig`. */
export const layer = Layer.effect(Auth, makeAuth);

/** The operations the `Auth` service provides. */
export type AuthService = {
  /** The Better Auth instance. Use it for the HTTP handler; prefer `call` everywhere else. */
  readonly instance: BetterAuth;
  /** Calls a Better Auth API method and maps its failure to an `AppError` or `AuthError`. */
  readonly call: <A>(
    operation: string,
    f: (api: BetterAuth["api"]) => Promise<A>,
  ) => Effect.Effect<A, AppError | AuthError>;
  readonly getSession: (
    headers: Headers,
  ) => Effect.Effect<AuthSession | null, AppError | AuthError>;
};

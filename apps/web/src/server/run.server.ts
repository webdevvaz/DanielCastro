import "@tanstack/react-start/server-only";
import { isAppError } from "@daniel/shared/errors";
import { getRequestHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { Cause, Effect, Exit, Option } from "effect";

import { RequestHeaders } from "./request-headers.server";
import { runtime, type AppServices } from "./runtime.server";

/**
 * Logs through the app runtime, so the failure reaches the configured log format and exporter.
 * Falls back to the default logger when the runtime itself failed to build.
 */
const logUnexpectedFailure = async (cause: Cause.Cause<unknown>) => {
  const log = Effect.logError("Server function failed", cause);

  await runtime.runPromise(log).catch(() => Effect.runPromise(log));
};

/**
 * Runs a server Effect with the application services and the current request's headers
 * (`RequestHeaders`). Expected `AppError`s set the HTTP status and reach the client intact.
 * Anything else is logged and becomes a generic 500 error, so internal details never leak.
 */
export async function runServerEffect<A, E>(
  effect: Effect.Effect<A, E, AppServices | RequestHeaders>,
): Promise<A> {
  // Read request state here, synchronously, while the async context belongs to this request.
  // Inside the Effect, fibers can resume in another request's context (see `RequestHeaders`).
  const headers = new Headers(getRequestHeaders());

  const exit = await runtime.runPromiseExit(
    effect.pipe(Effect.provideService(RequestHeaders, headers)),
  );

  if (Exit.isSuccess(exit)) return exit.value;

  const failure = Cause.findErrorOption(exit.cause).pipe(Option.filter(isAppError));

  if (Option.isSome(failure)) {
    setResponseStatus(failure.value.status);

    throw failure.value;
  }

  await logUnexpectedFailure(exit.cause);

  setResponseStatus(500);

  throw new Error("Something went wrong. Try again later.");
}

/**
 * Runs a server-route program with the application services and the request's headers
 * (`RequestHeaders`). The program handles its own failures and always returns a response.
 */
export const runServerRoute = (
  request: Request,
  program: Effect.Effect<Response, never, AppServices | RequestHeaders>,
) => runtime.runPromise(program.pipe(Effect.provideService(RequestHeaders, request.headers)));

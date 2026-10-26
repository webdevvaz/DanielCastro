import { AppError, isAppError } from "@daniel/shared/errors";
import { createSerializationAdapter } from "@tanstack/react-router";
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import { Schema } from "effect";

/**
 * Start sends only `message` for thrown errors. This adapter encodes expected `AppError`s with
 * their schema so the client receives real error instances with `_tag` and `status`.
 */
const appErrorAdapter = createSerializationAdapter({
  key: "app-error",
  test: isAppError,
  toSerializable: Schema.encodeSync(AppError),
  fromSerializable: Schema.decodeSync(AppError),
});

/**
 * Rejects server-function calls that another site starts with the user's cookies. Page requests
 * are not checked, so links from other sites still open the app. Better Auth checks the origin of
 * its own endpoints.
 */
const csrfMiddleware = createCsrfMiddleware({
  filter: ({ handlerType }) => handlerType === "serverFn",
});

/**
 * Baseline security headers for every response. Add a Content-Security-Policy here once you know
 * the origins your app loads scripts, images, and styles from.
 */
const securityHeadersMiddleware = createMiddleware().server(({ next }) => {
  setResponseHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  setResponseHeader("X-Content-Type-Options", "nosniff");
  setResponseHeader("X-Frame-Options", "DENY");

  if (process.env.NODE_ENV === "production") {
    setResponseHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return next();
});

/**
 * Sets the HTTP status of every expected `AppError`, including `InvalidInputError` from a
 * validator, which runs before the handler and `runServerEffect`.
 */
const appErrorStatusMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (isAppError(error)) setResponseStatus(error.status);

    throw error;
  }
});

/** The TanStack Start instance: error serialization, CSRF protection, and security headers. */
export const startInstance = createStart(() => ({
  serializationAdapters: [appErrorAdapter],
  requestMiddleware: [csrfMiddleware, securityHeadersMiddleware],
  functionMiddleware: [appErrorStatusMiddleware],
}));

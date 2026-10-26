import "@tanstack/react-start/server-only";
import { Auth } from "@daniel/auth";
import { AccessDeniedError } from "@daniel/shared/errors";
import { Effect } from "effect";

import { RequestHeaders } from "../request-headers.server";

/** The session of the current request, or null when the visitor is signed out. */
export const getRequestSession = Effect.gen(function* () {
  const headers = yield* RequestHeaders;

  const auth = yield* Auth;

  return yield* auth.getSession(headers);
});

/** Fails with `AccessDeniedError` unless the user is an admin. */
export const requireAdmin = Effect.fn("requireAdmin")(function* (role: string | null | undefined) {
  if (role !== "admin") return yield* new AccessDeniedError();
});

import { Auth } from "@daniel/auth";
import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";

import { runtime } from "@/server/runtime.server";

/** Passes a request to the Better Auth handler. */
const handleAuthRequest = (request: Request) =>
  runtime.runPromise(
    Effect.gen(function* () {
      const auth = yield* Auth;

      return yield* Effect.promise(() => auth.instance.handler(request));
    }),
  );

/** Better Auth's HTTP endpoints: sign-in, sign-out, SSO callbacks, and plugin APIs. */
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
});

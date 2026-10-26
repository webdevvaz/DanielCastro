import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

import { runServerEffect } from "../run.server";
import { getRequestSession, requireAdmin } from "./session.server";

/**
 * The authorization boundary for private server functions. It reads the session once and puts
 * it on the context. A signed-out request is redirected to the sign-in page.
 */
export const authenticatedMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const session = await runServerEffect(getRequestSession);

    if (!session) throw redirect({ to: "/admin/sign-in" });

    return next({ context: { session: session.session, user: session.user } });
  },
);

/** Adds the admin check after authentication. Every admin-area server function uses it. */
export const adminMiddleware = createMiddleware({ type: "function" })
  .middleware([authenticatedMiddleware])
  .server(async ({ next, context }) => {
    await runServerEffect(requireAdmin(context.user.role));

    return next({ context });
  });

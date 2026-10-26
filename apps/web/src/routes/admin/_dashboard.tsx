import { AccessDeniedError } from "@daniel/shared/errors";
import { useQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AdminNav } from "@/admin/admin-nav";
import { getSessionQueryOptions } from "@/integrations/tanstack-query/auth-query-options";

function AdminLayout() {
  const context = Route.useRouteContext();
  const navigate = useNavigate();

  // The account this document was loaded for. The route context follows the session cache on
  // the next navigation, so it cannot tell that the account changed.
  const [documentUserId] = useState(context.user.id);

  const { data: session, isSuccess } = useQuery(context.getSessionQueryOptions);

  // The session ended, or another tab signed in as someone else: start again as a new document,
  // so nothing cached for the previous account stays in memory.
  const sessionEnded = isSuccess && (session === null || session.user.id !== documentUserId);

  useEffect(() => {
    if (sessionEnded) void navigate({ to: "/admin/sign-in", replace: true, reloadDocument: true });
  }, [navigate, sessionEnded]);

  if (sessionEnded) return null;

  return (
    <div className="admin">
      <AdminNav />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

/**
 * The admin area. Sends visitors without a session to the sign-in page, and shows "No access"
 * to a signed-in user who is not an admin. Every server function checks the role again.
 */
export const Route = createFileRoute("/admin/_dashboard")({
  context: () => ({ getSessionQueryOptions }),
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.query({
      ...context.getSessionQueryOptions,
      staleTime: "static",
    });

    if (!session) {
      throw redirect({ to: "/admin/sign-in", search: { redirect: location.href }, replace: true });
    }

    if (session.user.role !== "admin") throw new AccessDeniedError();

    return { user: session.user };
  },
  head: () => ({
    meta: [{ title: "Admin — Daniel Castro" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLayout,
});

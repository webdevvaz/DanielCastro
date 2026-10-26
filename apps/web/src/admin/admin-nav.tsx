import { Link, useRouteContext } from "@tanstack/react-router";

import { useSignOut } from "@/integrations/tanstack-query/use-sign-out";

/** The admin area's navigation, the signed-in user, and sign-out. */
export function AdminNav() {
  const context = useRouteContext({ from: "/admin/_dashboard" });

  const signOut = useSignOut(context.queryClient);

  return (
    <nav className="admin-nav" aria-label="Admin">
      <Link to="/admin" aria-label="Admin overview">
        <img src="/assets/brand/wordmark-white.webp" alt="" width={600} height={226} />
      </Link>
      <Link to="/admin" activeOptions={{ exact: true }}>
        Overview
      </Link>
      <Link to="/admin/gallery">Gallery</Link>
      <Link to="/admin/guest-spots">Guest spots</Link>
      <Link to="/admin/travel">Travel</Link>
      <Link to="/admin/instagram">Instagram</Link>
      <div className="admin-nav-end">
        <p className="admin-nav-user">{context.user.email}</p>
        <Link to="/">View site</Link>
        <button type="button" disabled={signOut.isPending} onClick={() => signOut.mutate()}>
          {signOut.isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </nav>
  );
}

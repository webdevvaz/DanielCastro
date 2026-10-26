import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext, useSearch } from "@tanstack/react-router";

import { InstagramAccount } from "./instagram-account";
import { InstagramPostGrid } from "./instagram-post-grid";

/** Why the page lists no posts, keyed by the posts status. */
const NO_POSTS_TEXT = {
  ready: "The account has no posts yet.",
  not_connected: "Connect the account to see its posts here.",
  unavailable: "The posts cannot load at this time. Try again later.",
} as const;

/** Connects Daniel's Instagram account and adds its posts to the gallery. */
export function AdminInstagramPage() {
  const context = useRouteContext({ from: "/admin/_dashboard/instagram" });
  const search = useSearch({ from: "/admin/_dashboard/instagram" });

  const { data: view } = useSuspenseQuery(context.adminInstagramQueryOptions);

  return (
    <>
      <p className="eyebrow">
        <b>Admin</b> Instagram
      </p>
      <h1>Instagram</h1>
      <p className="lead">
        The <Link to="/news">News page</Link> shows the latest posts from Daniel&apos;s Instagram
        account. Connect the account once; the site renews its access by itself. To show a post in
        the gallery too, use &ldquo;Add to gallery&rdquo;.
      </p>

      {search.connect === "failed" ? (
        <p className="form-error" role="alert">
          Instagram did not connect. Try again. If the problem continues, make sure that the account
          is a professional account and that it is added to the Meta app.
        </p>
      ) : null}

      <section className="admin-section">
        <h2>Account</h2>
        <InstagramAccount view={view} />
      </section>

      <section className="admin-section">
        <h2>Recent posts</h2>
        {view.posts.length > 0 ? (
          <InstagramPostGrid posts={view.posts} />
        ) : (
          <p className="muted">{NO_POSTS_TEXT[view.postsStatus]}</p>
        )}
      </section>
    </>
  );
}

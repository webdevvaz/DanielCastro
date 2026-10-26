import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { appConfig } from "@/app-config";

import { NewsGrid } from "./news-grid";

/** Why the page shows no posts, keyed by the feed status. */
const EMPTY_TEXT = {
  ready: "No posts yet.",
  not_connected: "The latest posts are on Instagram.",
  unavailable: "The posts cannot load at this time. See them on Instagram.",
} as const;

/** The News page: Daniel's latest Instagram posts, each linking to the post. */
export function NewsPage() {
  const context = useRouteContext({ from: "/_site/news" });

  const { data: feed } = useSuspenseQuery(context.newsFeedQueryOptions);

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>News</b> From Instagram
            </p>
            <h1>
              Fresh from <em>the studio.</em>
            </h1>
          </div>
          <p className="lead">
            New work, flash, and guest spot dates, as Daniel posts them on Instagram.
          </p>
        </div>

        {feed.posts.length > 0 ? (
          <NewsGrid posts={feed.posts} />
        ) : (
          <p className="empty-state">{EMPTY_TEXT[feed.status]}</p>
        )}

        <div className="page-cta">
          <p>Follow Daniel for new work and flash days.</p>
          <a
            className="btn btn-red"
            href={appConfig.links.instagram}
            target="_blank"
            rel="noreferrer"
          >
            Follow on Instagram
          </a>
        </div>
      </div>
    </main>
  );
}

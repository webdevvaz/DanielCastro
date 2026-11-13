import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { appConfig } from "@/app-config";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { NewsGrid } from "./news-grid";
import { NEWS_PAGE_TEXT } from "./news-page-text";

/** The News page: Daniel's latest Instagram posts, each linking to the post. */
export function NewsPage() {
  const context = useRouteContext({ from: "/{-$locale}/_site/news" });
  const locale = useLocale();
  const site = useSiteMessages();
  const t = NEWS_PAGE_TEXT[locale];

  const { data: feed } = useSuspenseQuery(context.newsFeedQueryOptions);

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>{site.nav.news}</b> {t.eyebrowDetail}
            </p>
            <h1>
              {t.headingFirst} <em>{t.headingSecond}</em>
            </h1>
          </div>
          <p className="lead">{t.lead}</p>
        </div>

        {feed.posts.length > 0 ? (
          <NewsGrid posts={feed.posts} />
        ) : (
          <p className="empty-state">{t.empty[feed.status]}</p>
        )}

        <div className="page-cta">
          <p>{t.cta}</p>
          <a
            className="btn btn-red"
            href={appConfig.links.instagram}
            target="_blank"
            rel="noreferrer"
          >
            {t.follow}
          </a>
        </div>
      </div>
    </main>
  );
}

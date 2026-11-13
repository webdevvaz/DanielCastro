import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext, useSearch } from "@tanstack/react-router";

import { localeParam } from "@/i18n/locales";
import { RichText } from "@/i18n/rich-text";

import { useAdminText } from "../use-admin-text";
import { InstagramAccount } from "./instagram-account";
import { InstagramPostGrid } from "./instagram-post-grid";

/** Connects Daniel's Instagram account and adds its posts to the gallery. */
export function AdminInstagramPage() {
  const context = useRouteContext({ from: "/admin/_dashboard/instagram" });
  const search = useSearch({ from: "/admin/_dashboard/instagram" });

  const { locale, t } = useAdminText();

  const { data: view } = useSuspenseQuery(context.adminInstagramQueryOptions);

  const newsLive = view.connection !== null && !view.connection.expired;

  return (
    <>
      <p className="eyebrow">
        <b>{t.nav.label}</b> {t.instagram.title}
      </p>
      <h1>{t.instagram.title}</h1>
      <p className="lead">
        <RichText
          template={t.instagram.lead}
          values={{
            link: (
              <Link to="/{-$locale}/news" params={{ locale: localeParam(locale) }}>
                {t.instagram.link}
              </Link>
            ),
          }}
        />
      </p>

      <p className="news-status" data-live={newsLive}>
        {newsLive ? t.instagram.live : t.instagram.hidden}
      </p>

      {search.connect === "failed" ? (
        <p className="form-error" role="alert">
          {t.instagram.connectFailed}
        </p>
      ) : null}

      <section className="admin-section">
        <h2>{t.instagram.account}</h2>
        <InstagramAccount view={view} />
      </section>

      <section className="admin-section">
        <h2>{t.instagram.posts}</h2>
        {view.posts.length > 0 ? (
          <InstagramPostGrid posts={view.posts} />
        ) : (
          <p className="muted">{t.instagram.noPosts[view.postsStatus]}</p>
        )}
      </section>
    </>
  );
}

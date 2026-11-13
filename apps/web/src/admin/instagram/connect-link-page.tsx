import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams, useRouteContext, useSearch } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";

import { DATE_LOCALES, localeParam } from "@/i18n/locales";

import { AdminLanguageSwitch } from "../admin-language-switch";
import { useAdminText } from "../use-admin-text";

/** Instagram's page with the invitations of apps in development, which Daniel accepts once. */
const INSTAGRAM_INVITES_URL = "https://www.instagram.com/accounts/manage_access/";

/** A server route, not a page: a full navigation that ends at Instagram Login. */
const connectUrl = (token: string) => `/api/instagram/connect?link=${encodeURIComponent(token)}`;

/**
 * What Daniel sees when he opens a connect link: two steps (accept the invitation, then log in),
 * and the outcome when Instagram sends him back.
 */
export function ConnectLinkPage() {
  const context = useRouteContext({ from: "/admin/connect-instagram/$token" });
  const { token } = useParams({ from: "/admin/connect-instagram/$token" });
  const search = useSearch({ from: "/admin/connect-instagram/$token" });

  const { locale, t } = useAdminText();
  const c = t.connectLink;

  const { data: link } = useSuspenseQuery(context.instagramConnectLinkQueryOptions(token));

  return (
    <main className="sign-in" lang={locale}>
      <div className="sign-in-card connect-link">
        <img src="/assets/brand/badge-white.webp" alt="" width={900} height={736} />
        <p className="eyebrow">{c.eyebrow}</p>
        <h1>{c.title}</h1>
        {link.status === "invalid" ? <p className="form-error">{c.invalid}</p> : null}
        {link.status === "not_configured" ? <p className="form-error">{c.notConfigured}</p> : null}
        {link.status === "ready" && search.result === "connected" ? (
          <>
            <p className="connect-link-done" role="status">
              {c.results.connected}
            </p>
            <Link
              className="btn btn-ghost"
              to="/{-$locale}/news"
              params={{ locale: localeParam(locale) }}
            >
              {c.viewNews}
            </Link>
          </>
        ) : null}
        {link.status === "ready" && search.result !== "connected" ? (
          <>
            {search.result === "cancelled" ? (
              <p className="form-error">{c.results.cancelled}</p>
            ) : null}
            {search.result === "failed" ? <p className="form-error">{c.results.failed}</p> : null}
            {search.result === "wrong_account" ? (
              <p className="form-error">{c.results.wrong_account(link.username)}</p>
            ) : null}
            <p className="lead">{c.intro}</p>
            <ol className="connect-link-steps">
              <li>
                <p>{c.stepInvite}</p>
                <a
                  className="btn btn-ghost btn-small"
                  href={INSTAGRAM_INVITES_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  {c.openInvites}
                </a>
              </li>
              <li>
                <p>{c.stepConnect(link.username)}</p>
                <a className="btn btn-red" href={connectUrl(token)}>
                  {c.connect}
                </a>
              </li>
            </ol>
            <p className="field-hint">
              {c.validUntil(
                format(parseISO(link.expiresAt), "d MMM yyyy", { locale: DATE_LOCALES[locale] }),
              )}
            </p>
          </>
        ) : null}
        <AdminLanguageSwitch />
      </div>
    </main>
  );
}

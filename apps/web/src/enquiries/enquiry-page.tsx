import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useState } from "react";

import { appConfig } from "@/app-config";
import { formatDateRange } from "@/components/format-date-range";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { EnquiryForm } from "./enquiry-form";
import { ENQUIRY_TEXT } from "./enquiry-text";

/**
 * The enquiry page: the form, then a thank-you once it is sent. While the books are closed, a
 * notice with the reopening day, when the studio set one, replaces the form.
 */
export function EnquiryPage() {
  const context = useRouteContext({ from: "/{-$locale}/_site/enquiry" });
  const site = useSiteMessages();
  const locale = useLocale();
  const t = ENQUIRY_TEXT[locale];

  const [sent, setSent] = useState(false);

  const { data: booking } = useSuspenseQuery(context.bookingStatusQueryOptions);

  return (
    <main className="page">
      <div className="wrap enquiry">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>{site.nav.enquiry}</b> {t.eyebrowDetail}
            </p>
            <h1>
              {t.headingFirst} <em>{t.headingSecond}</em>
            </h1>
          </div>
          <div>
            <p className="lead">{t.intro}</p>
            {t.languageNote === null ? null : <p className="muted">{t.languageNote}</p>}
          </div>
        </div>

        {!booking.booksOpen && !sent ? (
          <div className="panel enquiry-done" role="status">
            <h2>{t.closed.title}</h2>
            <p>{t.closed.text}</p>
            {booking.reopensOn === null ? null : (
              <p>
                {t.closed.reopens(formatDateRange(booking.reopensOn, booking.reopensOn, locale))}
              </p>
            )}
            <a
              className="btn btn-ghost"
              href={appConfig.links.instagram}
              target="_blank"
              rel="noreferrer"
            >
              {t.closed.instagram}
            </a>
          </div>
        ) : null}
        {sent ? (
          <div className="panel enquiry-done" role="status">
            <h2>{t.done.title}</h2>
            <p>{t.done.text}</p>
            <button className="btn btn-ghost" type="button" onClick={() => setSent(false)}>
              {t.done.another}
            </button>
          </div>
        ) : null}
        {booking.booksOpen && !sent ? (
          <EnquiryForm
            onSent={() => {
              setSent(true);

              window.scrollTo({ top: 0 });
            }}
          />
        ) : null}
      </div>
    </main>
  );
}

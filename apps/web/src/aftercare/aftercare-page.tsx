import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { AFTERCARE_PAGE_TEXT } from "./aftercare-page-text";

/** The Aftercare page: how to look after a new tattoo, day by day, in the page's language. */
export function AftercarePage() {
  const site = useSiteMessages();
  const t = AFTERCARE_PAGE_TEXT[useLocale()];

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>{site.nav.aftercare}</b> {t.eyebrowDetail}
            </p>
            <h1>
              {t.headingFirst} <em>{t.headingSecond}</em>
            </h1>
          </div>
          <p className="lead">{t.lead}</p>
        </div>

        <div className="aftercare">
          <div>
            <section>
              <h2 className="page-subtitle">{t.firstDayTitle}</h2>
              <ol className="care-steps">
                {t.firstDay.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="page-subtitle">{t.followingTitle}</h2>
              <ul className="checklist">
                {t.following.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="page-subtitle">{t.normalTitle}</h2>
              <p className="muted">{t.normal}</p>
            </section>
          </div>

          <aside className="care-glance">
            <h2>{t.glanceTitle}</h2>
            <dl>
              {t.glance.map((item) => (
                <div key={item.rule}>
                  <dt>{item.rule}</dt>
                  <dd>{item.time}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}

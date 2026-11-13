import { appConfig } from "@/app-config";
import { useLocale } from "@/i18n/use-locale";

import { TRAVEL_TEXT } from "./travel-text";

/**
 * Practical tips for clients who come to Braga, from the studio's answers (PRODUCT.md, "Travel
 * facts"). The page shows them with or without a trip search.
 */
export function BragaTips() {
  const t = TRAVEL_TEXT[useLocale()].tips;

  return (
    <section className="trip" aria-labelledby="braga-tips-heading">
      <h2 id="braga-tips-heading">{t.title}</h2>
      <div className="trip-grid">
        <article className="trip-card">
          <h3>{t.stayTitle}</h3>
          <p>{t.stay}</p>
        </article>
        <article className="trip-card">
          <h3>{t.studioTitle}</h3>
          <p>{t.studio}</p>
        </article>
        <article className="trip-card">
          <h3>{t.parkingTitle}</h3>
          <p>{t.parking}</p>
          <a
            className="btn btn-ghost btn-small"
            href={appConfig.links.map}
            target="_blank"
            rel="noreferrer"
          >
            {t.map}
          </a>
        </article>
        <article className="trip-card">
          <h3>{t.sessionsTitle}</h3>
          <p>{t.sessions}</p>
        </article>
      </div>
    </section>
  );
}

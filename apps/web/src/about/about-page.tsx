import { Link } from "@tanstack/react-router";

import { localeParam } from "@/i18n/locales";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { ABOUT_PAGE_TEXT } from "./about-page-text";
import { StudioPhotos } from "./studio-photos";

/** A list of facts: what, where, and when. */
function FactList({ items }: { items: ReadonlyArray<Fact> }) {
  return (
    <ul className="fact-list">
      {items.map((item) => (
        <li key={`${item.title} ${item.year}`}>
          <b>{item.title}</b>
          <span>{item.where}</span>
          <span className="fact-year">{item.year}</span>
        </li>
      ))}
    </ul>
  );
}

/** The About page: Daniel's story, awards, conventions, guest spots, and the studio photos. */
export function AboutPage() {
  const locale = useLocale();
  const site = useSiteMessages();
  const t = ABOUT_PAGE_TEXT[locale];

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>{site.nav.about}</b> Daniel Castro
            </p>
            <h1>
              {site.tagline.first} <em>{site.tagline.second}</em>
            </h1>
          </div>
        </div>

        <div className="about">
          <img
            className="about-portrait"
            src="/assets/about/daniel-castro.webp"
            alt={t.portraitAlt}
            width={800}
            height={1067}
          />
          <div className="about-text">
            <blockquote className="about-quote">
              <p>{t.quote}</p>
            </blockquote>
            {t.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <h2 className="page-subtitle">{t.awardsTitle}</h2>
            <FactList items={t.awards} />

            <h2 className="page-subtitle">{t.conventionsTitle}</h2>
            <FactList items={t.conventions} />

            <h2 className="page-subtitle">{t.guestSpotsTitle}</h2>
            <FactList items={t.guestSpots} />
            <p className="muted">
              <Link to="/{-$locale}/guest-spots" params={{ locale: localeParam(locale) }}>
                {t.nextGuestSpots}
              </Link>
            </p>
          </div>
        </div>

        <StudioPhotos />

        <div className="page-cta">
          <p>{t.cta}</p>
          <Link
            className="btn btn-red"
            to="/{-$locale}/enquiry"
            params={{ locale: localeParam(locale) }}
          >
            {site.bookSession}
          </Link>
        </div>
      </div>
    </main>
  );
}

type Fact = {
  readonly title: string;
  readonly where: string;
  readonly year: string;
};

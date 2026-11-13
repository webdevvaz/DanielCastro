import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { PRIVACY_TEXT } from "./privacy-text";

/** The privacy notice: what the site collects, why, who sees it, for how long, and your rights. */
export function PrivacyPage() {
  const site = useSiteMessages();
  const t = PRIVACY_TEXT[useLocale()];

  return (
    <main className="page">
      <div className="wrap privacy">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>{site.nav.privacy}</b> {t.eyebrowDetail}
            </p>
            <h1>
              {t.headingFirst} <em>{t.headingSecond}</em>
            </h1>
          </div>
          <div>
            <p className="muted">{t.updated}</p>
            {t.translationNote === null ? null : <p className="muted">{t.translationNote}</p>}
          </div>
        </div>

        {t.sections.map((section) => (
          <section className="privacy-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items === undefined ? null : (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.after === undefined ? null : <p>{section.after}</p>}
          </section>
        ))}
      </div>
    </main>
  );
}

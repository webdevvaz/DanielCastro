import { Link } from "@tanstack/react-router";

import { appConfig } from "@/app-config";
import { localeParam } from "@/i18n/locales";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { HOW_TO_BOOK_PAGE_TEXT } from "./how-to-book-page-text";

/** The How to book page: the steps, what to send, how to prepare, and the common questions. */
export function HowToBookPage() {
  const locale = useLocale();
  const site = useSiteMessages();
  const t = HOW_TO_BOOK_PAGE_TEXT[locale];

  const params = { locale: localeParam(locale) };

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>{site.nav.howToBook}</b> {t.eyebrowDetail}
            </p>
            <h1>
              {t.headingFirst} <em>{t.headingSecond}</em>
            </h1>
          </div>
          <a
            className="btn btn-red"
            href={appConfig.links.enquiry}
            target="_blank"
            rel="noreferrer"
          >
            {t.start}
          </a>
        </div>

        <ol className="book-steps">
          {t.steps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
        {t.languageNote === null ? null : <p className="muted book-note">{t.languageNote}</p>}

        <div className="book-details">
          <section>
            <h2 className="page-subtitle">{t.whatToSendTitle}</h2>
            <ul className="checklist">
              {t.whatToSend.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="muted">
              {t.travel.before}{" "}
              <Link to="/{-$locale}/travel" params={params}>
                {t.travel.link}
              </Link>{" "}
              {t.travel.after}
            </p>

            <h2 className="page-subtitle">{t.beforeTitle}</h2>
            <ul className="checklist">
              {t.before.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="page-subtitle">{t.questionsTitle}</h2>
            <div className="faq">
              {t.questions.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
            <p className="muted">
              {t.aftercare.before}{" "}
              <Link to="/{-$locale}/aftercare" params={params}>
                {t.aftercare.link}
              </Link>
              {t.aftercare.after}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

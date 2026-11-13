import { Link } from "@tanstack/react-router";

import { localeParam } from "@/i18n/locales";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

/** Shown when no route matches the URL, in the language of the address when it has a prefix. */
export function NotFoundComponent() {
  const locale = useLocale();
  const t = useSiteMessages().errors;

  return (
    <main className="status-page">
      <p className="eyebrow">
        <b>404</b>
      </p>
      <h1>{t.notFoundTitle}</h1>
      <p className="lead">{t.notFoundText}</p>
      <div className="actions">
        <Link className="btn btn-red" to="/{-$locale}" params={{ locale: localeParam(locale) }}>
          {t.home}
        </Link>
      </div>
    </main>
  );
}

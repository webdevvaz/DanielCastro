import { isAppError } from "@daniel/shared/errors";
import { Link } from "@tanstack/react-router";

import { localeParam } from "@/i18n/locales";
import { useSiteMessages, type SiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

/** The status of a failed request, when the error carries one. */
function statusOf(error: unknown) {
  if (error instanceof Response) return error.status;

  if (isAppError(error)) return error.status;

  return null;
}

/** The title and text for an error status, in the page's language. */
function describe(status: number | null, t: SiteMessages["errors"]) {
  if (status === 401) return { title: t.signInTitle, text: t.signInText };

  if (status === 403) return { title: t.forbiddenTitle, text: t.forbiddenText };

  return { title: t.genericTitle, text: t.genericText };
}

/**
 * The router's error page, in the language of the page's address. Server functions deliver
 * expected failures as `AppError` instances (see `src/start.ts`), so the status comes from the
 * server's typed error.
 */
export function RootErrorComponent({ error, reset }: RootErrorComponentProps) {
  const locale = useLocale();
  const t = useSiteMessages().errors;

  const status = statusOf(error);
  const { title, text } = describe(status, t);

  const retry = () => {
    if (reset) {
      reset();

      return;
    }

    window.location.reload();
  };

  return (
    <main className="status-page">
      <p className="eyebrow">
        <b>{status ?? t.eyebrow}</b>
      </p>
      <h1>{title}</h1>
      <p className="lead">{text}</p>
      <div className="actions">
        {status === 401 ? (
          <Link className="btn btn-red" to="/admin/sign-in">
            {t.signIn}
          </Link>
        ) : (
          <button className="btn btn-red" type="button" onClick={retry}>
            {t.tryAgain}
          </button>
        )}
        <Link className="btn btn-ghost" to="/{-$locale}" params={{ locale: localeParam(locale) }}>
          {t.home}
        </Link>
      </div>
    </main>
  );
}

interface RootErrorComponentProps {
  error: unknown;
  reset?: () => void;
}

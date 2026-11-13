import { useState } from "react";

import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { EnquiryForm } from "./enquiry-form";
import { ENQUIRY_TEXT } from "./enquiry-text";

/** The enquiry page: the form, then a thank-you once it is sent. */
export function EnquiryPage() {
  const site = useSiteMessages();
  const t = ENQUIRY_TEXT[useLocale()];

  const [sent, setSent] = useState(false);

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

        {sent ? (
          <div className="panel enquiry-done" role="status">
            <h2>{t.done.title}</h2>
            <p>{t.done.text}</p>
            <button className="btn btn-ghost" type="button" onClick={() => setSent(false)}>
              {t.done.another}
            </button>
          </div>
        ) : (
          <EnquiryForm
            onSent={() => {
              setSent(true);

              window.scrollTo({ top: 0 });
            }}
          />
        )}
      </div>
    </main>
  );
}

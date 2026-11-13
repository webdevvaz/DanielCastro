import { Link } from "@tanstack/react-router";

import { appConfig } from "@/app-config";
import { localeParam } from "@/i18n/locales";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

/** The studio address, email, and social links. The side menu and the phone footer show them. */
export function SiteContact() {
  const locale = useLocale();
  const t = useSiteMessages();

  return (
    <div className="site-contact">
      <h4>{t.contact.heading}</h4>
      <a href={appConfig.links.map} target="_blank" rel="noreferrer">
        {appConfig.studio.addressLines.map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
      </a>
      <p>
        <a href={`mailto:${appConfig.studio.email}`}>{appConfig.studio.email}</a>
        <br />
        {t.contact.byAppointment}
      </p>
      <p>
        <a href={appConfig.links.instagram} target="_blank" rel="noreferrer">
          Instagram
        </a>
        {" · "}
        <a href={appConfig.links.tiktok} target="_blank" rel="noreferrer">
          TikTok
        </a>
        {" · "}
        <a href={appConfig.links.youtube} target="_blank" rel="noreferrer">
          YouTube
        </a>
        {" · "}
        <Link to="/admin">{t.contact.admin}</Link>
      </p>
      <p>
        <Link to="/{-$locale}/privacy" params={{ locale: localeParam(locale) }}>
          {t.contact.privacy}
        </Link>
      </p>
    </div>
  );
}

import { Link } from "@tanstack/react-router";

import { appConfig } from "@/app-config";
import { localeParam } from "@/i18n/locales";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { InstagramIcon, TikTokIcon, YouTubeIcon } from "./social-icons";

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
      <p className="site-social">
        <a
          href={appConfig.links.instagram}
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          title="Instagram"
        >
          <InstagramIcon />
        </a>
        <a
          href={appConfig.links.tiktok}
          target="_blank"
          rel="noreferrer"
          aria-label="TikTok"
          title="TikTok"
        >
          <TikTokIcon />
        </a>
        <a
          href={appConfig.links.youtube}
          target="_blank"
          rel="noreferrer"
          aria-label="YouTube"
          title="YouTube"
        >
          <YouTubeIcon />
        </a>
      </p>
      <p>
        <Link to="/{-$locale}/privacy" params={{ locale: localeParam(locale) }}>
          {t.contact.privacy}
        </Link>
        {" · "}
        <Link to="/admin">{t.contact.admin}</Link>
      </p>
    </div>
  );
}

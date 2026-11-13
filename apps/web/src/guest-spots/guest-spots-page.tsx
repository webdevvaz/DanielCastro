import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { appConfig } from "@/app-config";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { GuestSpotList } from "./guest-spot-list";
import { GUEST_SPOTS_PAGE_TEXT } from "./guest-spots-page-text";

/** The Guest spots page: the home studio in Braga and the upcoming guest spots. */
export function GuestSpotsPage() {
  const context = useRouteContext({ from: "/{-$locale}/_site/guest-spots" });
  const site = useSiteMessages();
  const t = GUEST_SPOTS_PAGE_TEXT[useLocale()];

  const { data: spots } = useSuspenseQuery(context.upcomingGuestSpotsQueryOptions);

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>{site.nav.guestSpots}</b> {t.eyebrowDetail}
            </p>
            <h1>
              {t.headingFirst} <em>{t.headingSecond}</em>
            </h1>
          </div>
          <p className="lead">{t.lead}</p>
        </div>

        <div className="studio-card">
          <div>
            <p className="eyebrow">{t.homeStudio}</p>
            <h2>{t.homeCity}</h2>
            <p className="muted">
              {appConfig.studio.name} · {appConfig.studio.addressLines.join(", ")} ·{" "}
              {site.contact.byAppointment}
            </p>
          </div>
          <a className="btn btn-ghost" href={appConfig.links.map} target="_blank" rel="noreferrer">
            {t.openMap}
          </a>
        </div>

        <h2 className="page-subtitle">{t.upcoming}</h2>
        <GuestSpotList spots={spots} />

        <div className="page-cta">
          <p>{t.cta}</p>
          <a
            className="btn btn-red"
            href={appConfig.links.enquiry}
            target="_blank"
            rel="noreferrer"
          >
            {site.bookSession}
          </a>
        </div>
      </div>
    </main>
  );
}

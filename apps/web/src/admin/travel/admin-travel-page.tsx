import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";

import { localeParam } from "@/i18n/locales";
import { RichText } from "@/i18n/rich-text";

import { useAdminText } from "../use-admin-text";
import { TravelSettingsForm } from "./travel-settings-form";

/** The travel estimator's settings: the figures an admin sets, and where other prices come from. */
export function AdminTravelPage() {
  const context = useRouteContext({ from: "/admin/_dashboard/travel" });

  const { locale, t } = useAdminText();

  const { data: settings } = useSuspenseQuery(context.adminTravelSettingsQueryOptions);

  return (
    <>
      <p className="eyebrow">
        <b>{t.nav.label}</b> {t.travel.eyebrow}
      </p>
      <h1>{t.travel.title}</h1>
      <p className="lead">
        <RichText
          template={t.travel.lead}
          values={{
            link: (
              <Link to="/{-$locale}/travel" params={{ locale: localeParam(locale) }}>
                {t.travel.link}
              </Link>
            ),
          }}
        />
      </p>

      <section className="admin-section">
        <h2>{t.travel.transportTitle}</h2>
        <TravelSettingsForm settings={settings} />
      </section>

      <section className="admin-section">
        <h2>{t.travel.pricesTitle}</h2>
        <p className="lead">
          <RichText
            template={t.travel.flights}
            values={{ setting: <code>TRAVELPAYOUTS_TOKEN</code> }}
          />
        </p>
        <p className="lead">{t.travel.live}</p>
        <p className="lead">
          <RichText template={t.travel.hotels} values={{ setting: <code>SERPAPI_API_KEY</code> }} />
        </p>
      </section>
    </>
  );
}

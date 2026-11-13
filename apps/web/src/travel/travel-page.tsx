import { useSearch } from "@tanstack/react-router";

import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { BragaTips } from "./braga-tips";
import { TRAVEL_TEXT } from "./travel-text";
import { TripEstimate } from "./trip-estimate";
import { TripSearchForm } from "./trip-search-form";

/**
 * The travel estimator: the search form, the estimate once the visitor has searched, and tips for
 * Braga.
 */
export function TravelPage() {
  const search = useSearch({ from: "/{-$locale}/_site/travel" });
  const site = useSiteMessages();
  const t = TRAVEL_TEXT[useLocale()];

  return (
    <main className="page trip-page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>{site.nav.travel}</b> {t.eyebrowDetail}
            </p>
            <h1>
              {t.headingFirst} <em>{t.headingSecond}</em>
            </h1>
            <p className="lead">{t.lead}</p>
          </div>
        </div>
        <TripSearchForm search={search} />
        {search.from === undefined ? null : (
          <TripEstimate input={{ from: search.from, arrive: search.arrive, leave: search.leave }} />
        )}
        <BragaTips />
      </div>
    </main>
  );
}

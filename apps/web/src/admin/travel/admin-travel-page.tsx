import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";

import { TravelSettingsForm } from "./travel-settings-form";

/** The travel estimator's settings: the figures an admin sets, and where other prices come from. */
export function AdminTravelPage() {
  const context = useRouteContext({ from: "/admin/_dashboard/travel" });

  const { data: settings } = useSuspenseQuery(context.adminTravelSettingsQueryOptions);

  return (
    <>
      <p className="eyebrow">
        <b>Admin</b> Travel
      </p>
      <h1>Travel estimator</h1>
      <p className="lead">
        The{" "}
        <Link to="/{-$locale}/travel" params={{ locale: undefined }}>
          travel page
        </Link>{" "}
        shows these typical prices for the bus, a rental car, and Uber from the airport. Enter
        one-way and per-day prices; the page works out the price for both ways and for the days of
        each trip. For hotels it shows live prices, and uses the hotel prices here only when live
        prices are not available. Until you save them, it shows links only.
      </p>

      <section className="admin-section">
        <h2>Transport and hotels</h2>
        <TravelSettingsForm settings={settings} />
      </section>

      <section className="admin-section">
        <h2>Flight and hotel prices</h2>
        <p className="lead">
          Flight prices are the average price of each airline for both ways, from the fares that
          Aviasales users found in the last few days. They come free from Travelpayouts and need its
          token in the server setting <code>TRAVELPAYOUTS_TOKEN</code>; the site reads them again
          once a day.
        </p>
        <p className="lead">
          Some routes, mostly from outside Europe, have too few recent fares. For these, the site
          shows live Google Flights prices through SerpApi: one search per city and dates, reused
          for a day. When no live prices are available, it shows the average of all airlines
          together, if there is one, or only the Google Flights button.
        </p>
        <p className="lead">
          Hotel prices are live Google Hotels prices through SerpApi. Each new stay uses one search;
          the site reuses results for 6 hours. Both SerpApi uses need its API key in the server
          setting <code>SERPAPI_API_KEY</code>. Without the key, or when the plan&apos;s searches
          are used up, the travel page shows the typical hotel prices above.
        </p>
      </section>
    </>
  );
}

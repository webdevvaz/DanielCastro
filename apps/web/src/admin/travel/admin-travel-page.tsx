import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";

import { TravelSettingsForm } from "./travel-settings-form";

/** The travel estimator's settings: the figures an admin sets, and where flight prices come from. */
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
        The <Link to="/travel">travel page</Link> shows these typical prices for the bus, a rental
        car, and Uber from the airport. Enter one-way and per-day prices; the page works out the
        price for both ways and for the days of each trip. For hotels it shows live prices, and uses
        the hotel prices here only when live prices are not available. Until you save them, it shows
        links only.
      </p>

      <section className="admin-section">
        <h2>Transport and hotels</h2>
        <TravelSettingsForm settings={settings} />
      </section>

      <section className="admin-section">
        <h2>Live prices</h2>
        <p className="lead">
          Flight and hotel prices are live Google Flights and Google Hotels prices through SerpApi,
          and need its API key in the server setting <code>SERPAPI_API_KEY</code>. A new trip uses
          two SerpApi searches, one for flights and one for hotels; the site reuses results for 6
          hours. Without the key, or when the plan&apos;s searches are used up, the travel page
          shows links and the typical prices only.
        </p>
      </section>
    </>
  );
}

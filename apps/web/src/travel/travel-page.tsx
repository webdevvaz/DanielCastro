import { useSearch } from "@tanstack/react-router";

import { TripEstimate } from "./trip-estimate";
import { TripSearchForm } from "./trip-search-form";

/** The travel estimator: the search form, and the estimate once the visitor has searched. */
export function TravelPage() {
  const search = useSearch({ from: "/_site/travel" });

  return (
    <main className="page trip-page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>Travel</b> Coming to Braga
            </p>
            <h1>
              Plan the trip <em>to your tattoo.</em>
            </h1>
            <p className="lead">
              Enter your city to see what the trip can cost: a flight to Porto, getting to Braga,
              and a hotel. Add your dates for closer prices.
            </p>
          </div>
        </div>
        <TripSearchForm search={search} />
        {search.from === undefined ? null : (
          <TripEstimate input={{ from: search.from, arrive: search.arrive, leave: search.leave }} />
        )}
      </div>
    </main>
  );
}

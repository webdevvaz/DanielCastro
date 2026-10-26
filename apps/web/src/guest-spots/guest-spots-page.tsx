import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { appConfig } from "@/app-config";

import { GuestSpotList } from "./guest-spot-list";

/** The Guest spots page: the home studio in Braga and the upcoming guest spots. */
export function GuestSpotsPage() {
  const context = useRouteContext({ from: "/_site/guest-spots" });

  const { data: spots } = useSuspenseQuery(context.upcomingGuestSpotsQueryOptions);

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>Guest spots</b> On the road
            </p>
            <h1>
              Daniel <em>on the road.</em>
            </h1>
          </div>
          <p className="lead">
            Sessions in Braga and in other studios across Europe. Choose the city in your enquiry.
          </p>
        </div>

        <div className="studio-card">
          <div>
            <p className="eyebrow">Home studio</p>
            <h2>Braga, Portugal</h2>
            <p className="muted">
              {appConfig.studio.name} · {appConfig.studio.addressLines.join(", ")} · By appointment
              only
            </p>
          </div>
          <a className="btn btn-ghost" href={appConfig.links.map} target="_blank" rel="noreferrer">
            Open in Google Maps
          </a>
        </div>

        <h2 className="page-subtitle">Upcoming guest spots</h2>
        <GuestSpotList spots={spots} />

        <div className="page-cta">
          <p>Choose Braga or a guest spot city in your enquiry.</p>
          <a
            className="btn btn-red"
            href={appConfig.links.enquiry}
            target="_blank"
            rel="noreferrer"
          >
            Book a session
          </a>
        </div>
      </div>
    </main>
  );
}

import { appConfig } from "@/app-config";

/**
 * Practical tips for clients who come to Braga, from the studio's answers (PRODUCT.md, "Travel
 * facts"). The page shows them with or without a trip search.
 */
export function BragaTips() {
  return (
    <section className="trip" aria-labelledby="braga-tips-heading">
      <h2 id="braga-tips-heading">In Braga</h2>
      <div className="trip-grid">
        <article className="trip-card">
          <h3>Where to stay</h3>
          <p>
            There is no accommodation near the studio. Stay in Braga's historic centre: the old
            town, restaurants, shops, and bars are there, and the studio is a short ride away.
          </p>
        </article>
        <article className="trip-card">
          <h3>To the studio</h3>
          <p>
            Buses 2 and 9 stop right in front of the studio, at the Ramoa stop. An Uber from the
            centre takes about 10 minutes and costs about €5.
          </p>
        </article>
        <article className="trip-card">
          <h3>Parking</h3>
          <p>
            Free parking on Rua da Ramoa, and behind the studio, from Av. Doutor António da Rocha.
          </p>
          <a
            className="btn btn-ghost btn-small"
            href={appConfig.links.map}
            target="_blank"
            rel="noreferrer"
          >
            Studio on Google Maps
          </a>
        </article>
        <article className="trip-card">
          <h3>Several sessions</h3>
          <p>
            Daniel finishes each area of skin in one session, so the next session does not wait for
            healing. For clients who travel: up to 4 sessions a week, every other day. A full arm
            sleeve usually takes 4 sessions, about a week in Braga.
          </p>
        </article>
      </div>
    </section>
  );
}

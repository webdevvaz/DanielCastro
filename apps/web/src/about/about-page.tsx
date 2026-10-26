import { Link } from "@tanstack/react-router";

import { appConfig } from "@/app-config";

/**
 * The About page. The biography uses the facts in PRODUCT.md; the full text and the list of awards
 * are placeholders until Daniel sends them.
 */
export function AboutPage() {
  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>About</b> Daniel Castro
            </p>
            <h1>
              A fan first. <em>An artist through and through.</em>
            </h1>
          </div>
        </div>

        <div className="about">
          <img src="/assets/brand/badge-white.webp" alt="" width={900} height={736} />
          <div className="about-text">
            <p className="lead">
              Daniel Castro is an award-winning tattoo artist based in Braga, Portugal.
            </p>
            <p>
              Every design is his own, drawn by hand for one person: characters from anime, films,
              comic books, and video games, mythologies, and fantasy, from medieval to dark and
              gothic. He works in black and white, with intricate linework, strong contrast, and
              small red accents when they suit the design.
            </p>
            <p>
              Besides the studio in Braga, he works guest spots in other studios across Europe.{" "}
              <Link to="/guest-spots">See the next dates.</Link>
            </p>

            <h2 className="page-subtitle">Awards</h2>
            <p className="empty-state">The list of awards is coming soon.</p>

            <div className="page-cta">
              <p>Have an idea for a piece?</p>
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
        </div>
      </div>
    </main>
  );
}

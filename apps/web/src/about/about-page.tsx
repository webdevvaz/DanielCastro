import { Link } from "@tanstack/react-router";

import { appConfig } from "@/app-config";

import { StudioPhotos } from "./studio-photos";

/** Awards from Daniel's CV, newest first. */
const AWARDS = [
  {
    title: "Third place, Anime Cartoon",
    where: "Urban Land Tattoo Expo Roma, Rome, Italy",
    year: "2024",
  },
  {
    title: "Second place, Anime/Manga/Kawaii Tattoo",
    where: "Lisbon Tattoo Rock Fest, Lisbon, Portugal",
    year: "2024",
  },
  {
    title: "First place, Best Anime/Manga Tattoo",
    where: "Lisbon Tattoo Rock Fest, Lisbon, Portugal",
    year: "2023",
  },
  { title: "Best of Day", where: "Lisbon Tattoo Rock Fest, Lisbon, Portugal", year: "2023" },
] as const;

/** Conventions from Daniel's CV. */
const CONVENTIONS = [
  { title: "Oporto Tattoo", where: "Porto, Portugal", year: "2017, 2019, 2022, 2023, 2025" },
  { title: "Lisbon Tattoo Rock Fest", where: "Lisbon, Portugal", year: "2023, 2024" },
  { title: "Urban Land Tattoo Expo Roma", where: "Rome, Italy", year: "2024" },
  { title: "The Tattooed Planet", where: "Manchester, United Kingdom", year: "2024" },
  {
    title: "Pyromaniacs International Tattoo Convention",
    where: "Luxembourg",
    year: "2019",
  },
] as const;

/** Cities of past guest spots, from Daniel's CV. Upcoming dates are on the Guest spots page. */
const GUEST_SPOT_CITIES = [
  { title: "Düsseldorf", where: "Germany", year: "2024–2026" },
  { title: "Zurich", where: "Switzerland", year: "2024, 2025" },
  { title: "London", where: "United Kingdom", year: "2025, 2026" },
  { title: "Amsterdam", where: "Netherlands", year: "2026" },
  { title: "Paris", where: "France", year: "2024" },
] as const;

/** A list of facts: what, where, and when. */
function FactList({ items }: { items: ReadonlyArray<Fact> }) {
  return (
    <ul className="fact-list">
      {items.map((item) => (
        <li key={`${item.title} ${item.year}`}>
          <b>{item.title}</b>
          <span>{item.where}</span>
          <span className="fact-year">{item.year}</span>
        </li>
      ))}
    </ul>
  );
}

/** The About page: Daniel's story, awards, conventions, guest spots, and the studio photos. */
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
          <img
            className="about-portrait"
            src="/assets/about/daniel-castro.webp"
            alt="Daniel Castro in his studio in Braga"
            width={800}
            height={1067}
          />
          <div className="about-text">
            <p className="lead">
              Daniel Castro has been tattooing since 2015. He works from his own studio in Braga,
              Portugal, and at guest spots across Europe.
            </p>
            <p>
              Every design is his own, drawn from scratch for the person who wears it: original
              blackwork inspired by anime, manga, and dark fantasy, and by films, comic books, video
              games, and mythologies. He works in black and white, with intricate linework, strong
              contrast, and small red accents when they suit the design. Most of his pieces are
              large and take several sessions.
            </p>
            <p>
              He opened his first studio in 2018 and his current studio in Braga in June 2023. Since
              2022 he has also been a resident artist with Squid Ink aboard Virgin Voyages ships,
              and since 2023 he has been a member of the Pepax Pro Team.
            </p>

            <h2 className="page-subtitle">Awards</h2>
            <FactList items={AWARDS} />

            <h2 className="page-subtitle">Conventions</h2>
            <FactList items={CONVENTIONS} />

            <h2 className="page-subtitle">Guest spots so far</h2>
            <FactList items={GUEST_SPOT_CITIES} />
            <p className="muted">
              <Link to="/guest-spots">See the next guest spots.</Link>
            </p>
          </div>
        </div>

        <StudioPhotos />

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
    </main>
  );
}

type Fact = {
  readonly title: string;
  readonly where: string;
  readonly year: string;
};

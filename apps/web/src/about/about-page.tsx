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
            <blockquote className="about-quote">
              <p>
                “When I was 6 years old, I was drawing on paper and someone told me: ‘Did you know
                it’s possible to make drawings on the skin that never wash off?’ That was the first
                time I heard about tattoos, and I have been fascinated ever since.”
              </p>
            </blockquote>
            <p>
              Daniel grew up always enjoying drawing, but life took him to another field. He
              graduated in electrotechnical engineering, and right after his graduation he got an
              internship with promises of a career. Fortunately for him, those promises were not
              kept, and he took that as the chance to follow his dream of becoming a tattoo artist.
            </p>
            <p>
              He enrolled in a tattoo course, to get the best guidance for his new adventure, and
              started what is now his career, in 2015. The road was not always smooth, but hard work
              pays off: he started on his own, and built his way to his own studio in Portugal and
              to travelling around the world with his art.
            </p>
            <p>
              Over the years he developed a very unique style, with linework as its foundation and
              inspiration from the artists who fascinated him as a kid: comic book artists, manga
              artists, and even Renaissance artists. Today he focuses mainly on anime themes in
              manga style, because he will always be a geek at heart, looking for the next challenge
              to improve his skills.
            </p>
            <p>
              His studio in Braga opened in June 2023. Since 2022 he has also been a resident artist
              with Squid Ink aboard Virgin Voyages ships, and since 2023 he has been a member of the
              Pepax Pro Team.
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

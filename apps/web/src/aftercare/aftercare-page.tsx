/**
 * Daniel's aftercare instructions, from the sheet the studio gives each client ("Informações e
 * cuidados a ter com a tatuagem"). The Portuguese original is the source; keep both in step.
 */
const FIRST_DAY = [
  "Take the film off after 2 hours, or after the time your artist tells you.",
  "Rinse with water and rub very gently with two fingers to clean off dried blood.",
  "Pat dry with paper towel, without dragging it over the skin.",
  "Apply BALM TATTOO healing cream after cleaning and before you go to sleep.",
] as const;

const FOLLOWING_DAYS = [
  "Apply a very thin layer of BALM TATTOO healing cream 2–3 times a day for 7 days.",
  "In the shower, do not scrub the tattoo with shower gel, and keep the water from running straight onto it for at least a week.",
  "Do not soak the tattoo for at least 2 weeks. For swimming pools, wait a month because of the chlorine.",
  "Rest for at least 4 days: avoid exercise and effort that works the muscles under the tattoo, so the lines do not open.",
  "Keep the tattoo out of the sun, dust, and similar for at least 2 weeks.",
  "Use SPF 50+ sunscreen whenever the tattoo is in the sun, so it does not fade or turn greenish. In the first 7 days, you can alternate the sunscreen with the BALM TATTOO cream if you need to.",
  "Do not scratch the tattoo or pick off the scabs while it heals.",
  "Avoid tight clothes over the tattoo for 2 weeks, so they do not pull off the scabs.",
  "Never cover the tattoo with film again, not even to shower or to sleep.",
  "Do not remove hair on the tattoo by any method (wax, razor, trimmer, cream) for at least 1 month.",
  "Never use laser hair removal over the tattoo.",
  "After it heals, keep the skin moisturised to slow down the ageing of the tattoo.",
  "No sauna, Turkish bath, sunbed, or similar until it has fully healed. Avoid sunbeds to protect the tattoo.",
] as const;

/** How long each rule lasts, from the timeline on the sheet. */
const AT_A_GLANCE = [
  { rule: "Film", time: "First 2 hours only" },
  { rule: "BALM TATTOO cream, 2–3 times a day", time: "7 days" },
  { rule: "No exercise or effort", time: "4 days" },
  { rule: "No direct water in the shower", time: "1 week" },
  { rule: "No sun, no dust", time: "2 weeks" },
  { rule: "No soaking in the sea or a river", time: "2 weeks" },
  { rule: "No swimming pools", time: "1 month" },
  { rule: "No hair removal", time: "1 month" },
  { rule: "No scratching, no picking scabs", time: "Until healed" },
  { rule: "No sauna, Turkish bath, or sunbed", time: "Until healed" },
  { rule: "SPF 50+ sunscreen in the sun", time: "Always" },
  { rule: "Moisturise the skin", time: "Always, after healing" },
  { rule: "No laser hair removal", time: "Always" },
] as const;

/** The Aftercare page: how to look after a new tattoo, day by day. */
export function AftercarePage() {
  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>Aftercare</b> After your session
            </p>
            <h1>
              Look after it, <em>and it lasts.</em>
            </h1>
          </div>
          <p className="lead">
            How you treat a new tattoo in the first weeks decides how it looks for years. Follow
            these steps, and ask the studio when something seems wrong.
          </p>
        </div>

        <div className="aftercare">
          <div>
            <section>
              <h2 className="page-subtitle">On the day</h2>
              <ol className="care-steps">
                {FIRST_DAY.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="page-subtitle">The following days</h2>
              <ul className="checklist">
                {FOLLOWING_DAYS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="page-subtitle">What is normal</h2>
              <p className="muted">
                Healing is different for everyone, but the first main phase usually takes 1 to 2
                weeks. During that time it is normal for the tattoo to scab, peel, and look whitish
                from the cream. Do not scratch it, so the tattoo heals without gaps.
              </p>
            </section>
          </div>

          <aside className="care-glance">
            <h2>At a glance</h2>
            <dl>
              {AT_A_GLANCE.map((item) => (
                <div key={item.rule}>
                  <dt>{item.rule}</dt>
                  <dd>{item.time}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}

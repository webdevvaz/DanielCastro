import { Link } from "@tanstack/react-router";

import { appConfig } from "@/app-config";

/** How a booking works, from the enquiry form. The deposit amount varies and is never shown. */
const STEPS = [
  {
    number: "I",
    title: "Send your idea",
    text: "Fill in the enquiry form: the theme, a short description, references, and a photo of the placement.",
  },
  {
    number: "II",
    title: "Quote & date",
    text: "Joana answers every enquiry by email with a private quote and the dates.",
  },
  {
    number: "III",
    title: "Deposit",
    text: "A non-refundable deposit secures your date. It is deducted from the price on the day.",
  },
  {
    number: "IV",
    title: "Design & session",
    text: "Every design is drawn close to the session. You get the final drawing the night before; small changes happen on the day.",
  },
] as const;

/** What an enquiry needs, from the enquiry form. */
const WHAT_TO_SEND = [
  "The theme or the character",
  "A short description of your idea",
  "Reference images",
  "A photo of the placement",
  "Braga, or a guest spot city",
] as const;

/** How to prepare, from the studio's email to every client after the deposit. */
const BEFORE_SESSION = [
  "Sleep well, and avoid alcohol and too much coffee the day before and on the day.",
  "Eat something in the hour before, and bring a snack for the session.",
  "Wear comfortable clothes: you stay in one position for a long time.",
  "Keep the area out of the sun, sunbeds, and any tanning for 2 weeks before.",
  "Keep your skin moisturised, and drink plenty of water.",
  "No need to shave: Daniel shaves the area on the day. If you prefer wax, do it at least 5 days before.",
  "Come without plans for later that day: sessions usually take 5 to 6 hours.",
  "Bring the rest of the payment in cash, or pay by MB WAY or Revolut. There is no card terminal.",
  "One companion aged 16 or over may come with you.",
] as const;

/** Answers from the studio (PRODUCT.md, "Policies"). Never show the deposit amount. */
const QUESTIONS = [
  {
    question: "How much does a tattoo cost?",
    answer:
      "Every piece is quoted privately, by email, after you send your idea. A single piece is priced by its complexity, size, and placement. Large projects, such as full sleeves, full backs, and other work of more than 3 sessions, have a fixed price per session. There are no hourly rates, and the quote changes only if the idea or the size changes; you always hear the new price before the session starts.",
  },
  {
    question: "Is there a deposit?",
    answer:
      "Yes. A non-refundable deposit confirms your date and is deducted from the price on the day. Until it is paid, the date is only pencilled in: if someone else asks for it, or the date is less than a month away, the studio contacts you to check that you want to go ahead.",
  },
  {
    question: "How do I pay?",
    answer:
      "The deposit by MB WAY, PayPal, Revolut, or bank transfer. The rest on the day in cash, or by MB WAY or Revolut. The studio has no card terminal.",
  },
  {
    question: "Can I change my date?",
    answer:
      "Yes, once, with at least 2 weeks' notice: your deposit moves to the new date. A second change needs a new deposit.",
  },
  {
    question: "What if I am late, or cannot come?",
    answer:
      "The studio waits up to 15 minutes; if you know you will be late, let the studio know. If you miss your session or cancel at short notice, you lose the deposit, and a new date needs 50% of the price paid in advance.",
  },
  {
    question: "Is there a minimum age?",
    answer: "Yes, 18. Daniel does not tattoo minors, even with their parents' permission.",
  },
  {
    question: "When can I not get tattooed?",
    answer:
      "When you are pregnant or breastfeeding, taking antibiotics or anticoagulants, having chemotherapy or a similar treatment, or under the influence of alcohol or drugs. The skin to be tattooed must be healthy: no sunburn, wounds, cuts, burns, or conditions such as psoriasis. If you have a skin condition elsewhere on your body, ask your doctor before you pay the deposit.",
  },
  {
    question: "How long is a session?",
    answer:
      "Almost every session takes the whole day, reserved for you alone. It starts at 11:00 and goes on until the piece is done: about 4 to 5 hours for a 20 cm piece, such as one side of a forearm, and 7 to 8 hours or more for 30 cm, such as the outer upper arm. On average, about 6 hours.",
  },
  {
    question: "Can a large project be done in one trip?",
    answer:
      'Usually, yes. Daniel works in "printer mode": he finishes each area of skin in one session and does not go back to it, so the next session does not wait for healing. We recommend a rest day or two between sessions, and no more than 2 days in a row. For clients who travel, up to 4 sessions a week, every other day: a full arm sleeve usually takes 4 sessions, so it can be done in about a week.',
  },
  {
    question: "When do I see the design?",
    answer:
      "Daniel draws it close to the session and sends it the night before, usually around 23:00. Reply if you want to change a detail: he adjusts it and sends it again, or changes it on the day before the stencil is printed. Changing the whole design or its structure means a new date and the loss of the deposit, because a design takes 3 to 4 hours to draw. Send any specific wishes before, so Daniel can draw them in.",
  },
  {
    question: "Are touch-ups free?",
    answer:
      "Small gaps in the lines or the shading are touched up for free within 6 months. Daniel looks at the healed tattoo first, because how it heals depends a lot on aftercare: your tattoo is a piece of art you carry for life, and it needs your care too. When a touch-up is needed because the tattoo was not looked after, for example after the beach, the sea, a pool, or sunburn, it is not free.",
  },
  {
    question: "Will my tattoo be posted online?",
    answer:
      "It may be. On the consent form you choose whether your face can be shown; if you say no, only photos and videos without your face are used.",
  },
  {
    question: "Which languages does the studio speak?",
    answer: "Portuguese and English.",
  },
  {
    question: "Do guest spots work the same way?",
    answer:
      "Mostly. Each host studio has its own rules, for example for companions and payment, and you get the guidelines for that studio when you book.",
  },
  {
    question: "Do you sell gift vouchers?",
    answer:
      "Yes, as printed vouchers to collect at the studio or to receive by post. Ask the studio by email.",
  },
  {
    question: "What does Daniel tattoo?",
    answer:
      "Custom designs only, in his own style: black and white linework with strong contrast and small red accents. No copies of other artists' work, no AI work, no cover-ups, and no full-colour projects.",
  },
] as const;

/** The How to book page: the steps, what to send, how to prepare, and the common questions. */
export function HowToBookPage() {
  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>How to book</b> From idea to ink
            </p>
            <h1>
              From idea <em>to ink.</em>
            </h1>
          </div>
          <a
            className="btn btn-red"
            href={appConfig.links.enquiry}
            target="_blank"
            rel="noreferrer"
          >
            Start your enquiry
          </a>
        </div>

        <ol className="book-steps">
          {STEPS.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="book-details">
          <section>
            <h2 className="page-subtitle">What to send</h2>
            <ul className="checklist">
              {WHAT_TO_SEND.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="muted">
              Travelling to Braga? <Link to="/travel">Estimate the trip</Link> before you send your
              enquiry.
            </p>

            <h2 className="page-subtitle">Before your session</h2>
            <ul className="checklist">
              {BEFORE_SESSION.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="page-subtitle">Questions</h2>
            <div className="faq">
              {QUESTIONS.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
            <p className="muted">
              After your session, follow the <Link to="/aftercare">aftercare guide</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

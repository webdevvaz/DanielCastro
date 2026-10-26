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

const QUESTIONS = [
  {
    question: "How much does a tattoo cost?",
    answer:
      "Every piece is quoted privately, by email, after you send your idea. Prices are not published.",
  },
  {
    question: "Is there a deposit?",
    answer:
      "Yes. A non-refundable deposit secures your date and is deducted from the price on the day.",
  },
  {
    question: "When do I see the design?",
    answer:
      "The night before your session. Small changes happen on the day, so each design stays unique.",
  },
  {
    question: "What does Daniel tattoo?",
    answer:
      "Custom designs only, in his own style: black and white linework with strong contrast and small red accents. No copies of other artists' work, no AI work, no cover-ups, and no full-colour projects.",
  },
] as const;

/** The How to book page: the steps, what to send, and the common questions. */
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
          </section>
        </div>
      </div>
    </main>
  );
}

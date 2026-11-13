import { createFileRoute } from "@tanstack/react-router";

import { HowToBookPage } from "@/how-to-book/how-to-book-page";
import { pageTitleFor } from "@/i18n/site-messages";

/** How a booking works. The page has no data to load. */
export const Route = createFileRoute("/{-$locale}/_site/how-to-book")({
  head: ({ params }) => ({ meta: [{ title: pageTitleFor(params.locale, "howToBook") }] }),
  component: HowToBookPage,
});

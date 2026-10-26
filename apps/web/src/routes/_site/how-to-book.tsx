import { createFileRoute } from "@tanstack/react-router";

import { HowToBookPage } from "@/how-to-book/how-to-book-page";

/** How a booking works. The page has no data to load. */
export const Route = createFileRoute("/_site/how-to-book")({
  head: () => ({ meta: [{ title: "How to book — Daniel Castro" }] }),
  component: HowToBookPage,
});

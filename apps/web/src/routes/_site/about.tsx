import { createFileRoute } from "@tanstack/react-router";

import { AboutPage } from "@/about/about-page";

/** About Daniel. The page has no data to load. */
export const Route = createFileRoute("/_site/about")({
  head: () => ({ meta: [{ title: "About — Daniel Castro" }] }),
  component: AboutPage,
});

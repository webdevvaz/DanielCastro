import { createFileRoute } from "@tanstack/react-router";

import { AftercarePage } from "@/aftercare/aftercare-page";

/** Aftercare instructions. The page has no data to load. */
export const Route = createFileRoute("/_site/aftercare")({
  head: () => ({ meta: [{ title: "Aftercare — Daniel Castro" }] }),
  component: AftercarePage,
});

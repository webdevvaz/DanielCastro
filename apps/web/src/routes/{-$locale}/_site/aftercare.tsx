import { createFileRoute } from "@tanstack/react-router";

import { AftercarePage } from "@/aftercare/aftercare-page";
import { pageTitleFor } from "@/i18n/site-messages";

/** Aftercare instructions. The page has no data to load. */
export const Route = createFileRoute("/{-$locale}/_site/aftercare")({
  head: ({ params }) => ({ meta: [{ title: pageTitleFor(params.locale, "aftercare") }] }),
  component: AftercarePage,
});

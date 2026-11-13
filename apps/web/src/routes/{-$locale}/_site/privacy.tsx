import { createFileRoute } from "@tanstack/react-router";

import { pageTitleFor } from "@/i18n/site-messages";
import { PrivacyPage } from "@/privacy/privacy-page";

/** The privacy notice. The page has no data to load. */
export const Route = createFileRoute("/{-$locale}/_site/privacy")({
  head: ({ params }) => ({ meta: [{ title: pageTitleFor(params.locale, "privacy") }] }),
  component: PrivacyPage,
});

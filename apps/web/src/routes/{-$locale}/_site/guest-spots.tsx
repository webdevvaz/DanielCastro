import { createFileRoute } from "@tanstack/react-router";

import { PagePending } from "@/components/page-skeleton";
import { GuestSpotsPage } from "@/guest-spots/guest-spots-page";
import { pageTitleFor } from "@/i18n/site-messages";

/** Guest spots. The site layout already starts loading them for the side menu. */
export const Route = createFileRoute("/{-$locale}/_site/guest-spots")({
  head: ({ params }) => ({ meta: [{ title: pageTitleFor(params.locale, "guestSpots") }] }),
  pendingComponent: PagePending,
  component: GuestSpotsPage,
});

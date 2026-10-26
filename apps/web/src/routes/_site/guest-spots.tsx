import { createFileRoute } from "@tanstack/react-router";

import { PagePending } from "@/components/page-skeleton";
import { GuestSpotsPage } from "@/guest-spots/guest-spots-page";

/** Guest spots. The site layout already starts loading them for the side menu. */
export const Route = createFileRoute("/_site/guest-spots")({
  head: () => ({ meta: [{ title: "Guest spots — Daniel Castro" }] }),
  pendingComponent: PagePending,
  component: GuestSpotsPage,
});

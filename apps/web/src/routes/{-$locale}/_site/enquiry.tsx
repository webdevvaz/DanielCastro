import { createFileRoute } from "@tanstack/react-router";

import { PagePending } from "@/components/page-skeleton";
import { EnquiryPage } from "@/enquiries/enquiry-page";
import { pageTitleFor } from "@/i18n/site-messages";

/**
 * The enquiry form, which replaces the studio's Google Form. The site layout already starts loading
 * the guest spots, which the form offers as places.
 */
export const Route = createFileRoute("/{-$locale}/_site/enquiry")({
  head: ({ params }) => ({ meta: [{ title: pageTitleFor(params.locale, "enquiry") }] }),
  pendingComponent: PagePending,
  component: EnquiryPage,
});

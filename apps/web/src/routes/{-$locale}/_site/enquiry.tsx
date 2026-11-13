import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PagePending } from "@/components/page-skeleton";
import { EnquiryPage } from "@/enquiries/enquiry-page";
import { pageTitleFor } from "@/i18n/site-messages";
import { bookingStatusQueryOptions } from "@/integrations/tanstack-query/booking-query-options";

/**
 * The enquiry form, which replaces the studio's Google Form, or a notice while the books are
 * closed. The site layout already starts loading the guest spots, which the form offers as places.
 */
export const Route = createFileRoute("/{-$locale}/_site/enquiry")({
  context: () => ({ bookingStatusQueryOptions }),
  loader: ({ context }) => {
    void context.queryClient.query(context.bookingStatusQueryOptions).catch(noop);
  },
  head: ({ params }) => ({ meta: [{ title: pageTitleFor(params.locale, "enquiry") }] }),
  pendingComponent: PagePending,
  component: EnquiryPage,
});

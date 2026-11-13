import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminEnquiriesPage } from "@/admin/enquiries/admin-enquiries-page";
import { SectionSkeleton } from "@/components/page-skeleton";
import { bookingStatusQueryOptions } from "@/integrations/tanstack-query/booking-query-options";
import { emailSettingsQueryOptions } from "@/integrations/tanstack-query/email-settings-query-options";
import { adminEnquiriesQueryOptions } from "@/integrations/tanstack-query/enquiry-query-options";

/** The enquiries sent through the site's form. */
export const Route = createFileRoute("/admin/_dashboard/enquiries/")({
  context: () => ({
    adminEnquiriesQueryOptions,
    emailSettingsQueryOptions,
    bookingStatusQueryOptions,
  }),
  loader: ({ context }) => {
    void context.queryClient.query(context.adminEnquiriesQueryOptions).catch(noop);
    void context.queryClient.query(context.emailSettingsQueryOptions).catch(noop);
    void context.queryClient.query(context.bookingStatusQueryOptions).catch(noop);
  },
  pendingComponent: () => <SectionSkeleton blocks={2} />,
  component: AdminEnquiriesPage,
});

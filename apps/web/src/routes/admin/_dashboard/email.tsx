import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminEmailPage } from "@/admin/email/admin-email-page";
import { SectionSkeleton } from "@/components/page-skeleton";
import { emailSettingsQueryOptions } from "@/integrations/tanstack-query/email-settings-query-options";

/** The enquiry email settings: sender, recipients, and the Resend API key. */
export const Route = createFileRoute("/admin/_dashboard/email")({
  context: () => ({ emailSettingsQueryOptions }),
  loader: ({ context }) => {
    void context.queryClient.query(context.emailSettingsQueryOptions).catch(noop);
  },
  pendingComponent: () => <SectionSkeleton blocks={3} />,
  component: AdminEmailPage,
});

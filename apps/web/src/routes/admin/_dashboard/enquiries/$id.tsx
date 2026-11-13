import { EnquiryId } from "@daniel/shared/enquiry";
import { NotFoundError } from "@daniel/shared/errors";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Option, Schema } from "effect";

import { AdminEnquiryPage } from "@/admin/enquiries/admin-enquiry-page";
import { SectionSkeleton } from "@/components/page-skeleton";
import { adminEnquiryQueryOptions } from "@/integrations/tanstack-query/enquiry-query-options";

const decodeId = Schema.decodeUnknownOption(EnquiryId);

/**
 * One enquiry. The loader waits for it, because a deleted or unknown enquiry must answer 404
 * instead of an empty page.
 */
export const Route = createFileRoute("/admin/_dashboard/enquiries/$id")({
  params: {
    parse: (raw) => {
      const id = decodeId(raw.id);

      if (Option.isNone(id)) throw notFound();

      return { id: id.value };
    },
  },
  context: () => ({ adminEnquiryQueryOptions }),
  loader: async ({ context, params }) => {
    await context.queryClient
      .query(context.adminEnquiryQueryOptions(params.id))
      .catch((error: unknown) => {
        if (error instanceof NotFoundError) throw notFound();

        throw error;
      });
  },
  pendingComponent: () => <SectionSkeleton blocks={3} />,
  component: AdminEnquiryPage,
});

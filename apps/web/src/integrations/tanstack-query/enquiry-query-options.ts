import { queryOptions } from "@tanstack/react-query";

import {
  getAdminEnquiries,
  getAdminEnquiry,
  getNewEnquiryCount,
} from "@/server/enquiries/enquiry.functions";

/** Query keys for enquiries. Invalidate `all` after any change. */
export const enquiryQueryKeys = {
  all: ["enquiries"] as const,
  list: ["enquiries", "list"] as const,
  newCount: ["enquiries", "new-count"] as const,
  detail: (id: string) => ["enquiries", "detail", id] as const,
};

/** Every enquiry, the newest first, for the admin list. */
export const adminEnquiriesQueryOptions = queryOptions({
  queryKey: enquiryQueryKeys.list,
  queryFn: () => getAdminEnquiries(),
});

/** How many enquiries nobody has answered yet. */
export const newEnquiryCountQueryOptions = queryOptions({
  queryKey: enquiryQueryKeys.newCount,
  queryFn: () => getNewEnquiryCount(),
});

/** One enquiry with every answer and its photos. */
export const adminEnquiryQueryOptions = (id: string) =>
  queryOptions({
    queryKey: enquiryQueryKeys.detail(id),
    queryFn: () => getAdminEnquiry({ data: { id } }),
  });

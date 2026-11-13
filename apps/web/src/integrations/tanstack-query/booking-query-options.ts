import { queryOptions } from "@tanstack/react-query";

import { getBookingStatus } from "@/server/booking/booking.functions";

/** Query keys for the booking settings. Invalidate `all` after changing them. */
export const bookingQueryKeys = {
  all: ["booking"] as const,
};

/** Whether Daniel takes new enquiries, and the day the books open again. */
export const bookingStatusQueryOptions = queryOptions({
  queryKey: bookingQueryKeys.all,
  queryFn: () => getBookingStatus(),
});

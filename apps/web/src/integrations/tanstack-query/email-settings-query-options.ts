import { queryOptions } from "@tanstack/react-query";

import { getEmailSettings } from "@/server/email/email-settings.functions";

/** Query keys for the email settings. */
export const emailSettingsQueryKeys = {
  all: ["email-settings"] as const,
};

/** The email settings, with only the last four characters of the Resend key. */
export const emailSettingsQueryOptions = queryOptions({
  queryKey: emailSettingsQueryKeys.all,
  queryFn: () => getEmailSettings(),
});

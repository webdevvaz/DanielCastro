import "@tanstack/react-start/server-only";
import type { UpdateBookingSettingsInput } from "@daniel/shared/booking";

import { saveBookingSettings } from "@daniel/db";
import { Effect } from "effect";

import { withAuditEvent } from "../observability/audit.server";

/** Opens or closes the books. Opening them clears the reopening day. */
export const updateBookingSettings = Effect.fn("updateBookingSettings")(
  function* (_userId: string, input: UpdateBookingSettingsInput) {
    yield* saveBookingSettings(input);
  },
  (effect, userId) =>
    effect.pipe(
      withAuditEvent({
        action: "booking.settings_updated",
        actorUserId: userId,
        targetType: "booking_settings",
      }),
    ),
);

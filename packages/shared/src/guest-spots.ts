import { Schema, Struct } from "effect";

import { CalendarDate, optionalText, requiredText } from "./schema-fields";

/** Whether booking is open for a guest spot. The database check uses the same list. */
export const GUEST_SPOT_STATUSES = ["open", "full"] as const;

/** Whether booking is open for a guest spot. */
export const GuestSpotStatus = Schema.Literals(GUEST_SPOT_STATUSES);

/** A guest spot ID (a UUID). */
export const GuestSpotId = Schema.String.check(Schema.isUUID());

/** The fields an admin fills in for a guest spot. `address` and `note` may be empty. */
const GuestSpotFields = Schema.Struct({
  city: requiredText("City", 80),
  country: requiredText("Country", 80),
  studioName: requiredText("Studio", 120),
  address: optionalText("Address", 200),
  startsOn: CalendarDate,
  endsOn: CalendarDate,
  status: GuestSpotStatus,
  note: optionalText("Note", 280),
});

/** The last day cannot come before the first day. ISO dates compare correctly as strings. */
const endsOnOrAfterStart = Schema.makeFilter(
  ({ startsOn, endsOn }: { readonly startsOn: string; readonly endsOn: string }) =>
    endsOn >= startsOn || { path: ["endsOn"], issue: "The last day must be on or after the first" },
);

/** A new guest spot. */
export const CreateGuestSpotInput = GuestSpotFields.check(endsOnOrAfterStart);

/** Changes to an existing guest spot. */
export const UpdateGuestSpotInput = GuestSpotFields.mapFields(
  Struct.assign({ id: GuestSpotId }),
).check(endsOnOrAfterStart);

/** Deletes a guest spot. */
export const DeleteGuestSpotInput = Schema.Struct({
  id: GuestSpotId,
});

/** Whether booking is open for a guest spot. */
export type GuestSpotStatus = typeof GuestSpotStatus.Type;

/** Decoded fields of a new guest spot. */
export type CreateGuestSpotInput = typeof CreateGuestSpotInput.Type;

/** Decoded changes to a guest spot. */
export type UpdateGuestSpotInput = typeof UpdateGuestSpotInput.Type;

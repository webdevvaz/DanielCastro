import { Schema } from "effect";

import { CalendarDate } from "./schema-fields";

/**
 * Whether Daniel takes new enquiries, and, while the books are closed, the day they open again.
 * `reopensOn` is optional, and the server ignores it while the books are open.
 */
export const UpdateBookingSettingsInput = Schema.Struct({
  booksOpen: Schema.Boolean,
  reopensOn: Schema.NullOr(CalendarDate),
});

/** Decoded booking settings. */
export type UpdateBookingSettingsInput = typeof UpdateBookingSettingsInput.Type;

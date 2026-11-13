import { sql } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "../database";
import { mapDatabaseError } from "../errors";
import { BOOKING_SETTINGS_ID, bookingSettings } from "../schema/booking";

/** The books are open until an admin closes them. */
const OPEN_BOOKS: BookingSettings = { booksOpen: true, reopensOn: null };

/** Whether Daniel takes new enquiries, and the day the books open again while they are closed. */
export const getBookingSettings = Effect.fn("db.getBookingSettings")(function* () {
  const db = yield* Database;

  const settings = yield* db.query.bookingSettings.findFirst({
    columns: { booksOpen: true, reopensOn: true },
    where: { id: { eq: BOOKING_SETTINGS_ID } },
  });

  return settings ?? OPEN_BOOKS;
}, mapDatabaseError("getBookingSettings"));

/** Opens or closes the books. Opening them clears the reopening day. */
export const saveBookingSettings = Effect.fn("db.saveBookingSettings")(function* (
  settings: BookingSettings,
) {
  const db = yield* Database;

  const values = {
    booksOpen: settings.booksOpen,
    reopensOn: settings.booksOpen ? null : settings.reopensOn,
  };

  yield* db
    .insert(bookingSettings)
    .values({ id: BOOKING_SETTINGS_ID, ...values })
    .onConflictDoUpdate({ target: bookingSettings.id, set: { ...values, updatedAt: sql`now()` } });
}, mapDatabaseError("saveBookingSettings"));

/** Whether the books are open, and the reopening day, such as 2026-12-01, while they are closed. */
export type BookingSettings = {
  readonly booksOpen: boolean;
  readonly reopensOn: string | null;
};

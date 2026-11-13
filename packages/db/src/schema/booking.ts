import { defineRelationsPart, sql } from "drizzle-orm";
import { boolean, check, date, integer, pgTable, timestamp } from "drizzle-orm/pg-core";

/** The ID of the only booking settings row. */
export const BOOKING_SETTINGS_ID = 1;

/**
 * Whether Daniel takes new enquiries, and the day the books open again while they are closed.
 * The table has at most one row; without it the books are open.
 */
export const bookingSettings = pgTable(
  "booking_settings",
  {
    id: integer("id").primaryKey().default(BOOKING_SETTINGS_ID),
    booksOpen: boolean("books_open").notNull(),
    reopensOn: date("reopens_on", { mode: "string" }),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    check(
      "booking_settings_single_row",
      sql`${table.id} = ${sql.raw(String(BOOKING_SETTINGS_ID))}`,
    ),
    // A reopening day only means something while the books are closed.
    check(
      "booking_settings_reopens_check",
      sql`${table.booksOpen} = false or ${table.reopensOn} is null`,
    ),
  ],
);

/** Registers the booking settings table with the relational query API. It has no relations. */
export const bookingRelations = defineRelationsPart({ bookingSettings });

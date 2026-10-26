import { GUEST_SPOT_STATUSES } from "@daniel/shared/guest-spots";
import { defineRelationsPart, sql } from "drizzle-orm";
import { check, date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// The status is text with a check rather than a Postgres enum: the driver reads results in the
// binary format and returns a user-defined type, such as an enum, as raw bytes.
const statusList = sql.raw(GUEST_SPOT_STATUSES.map((status) => `'${status}'`).join(", "));

/**
 * Daniel's sessions in other studios. Dates are calendar days in the host city, stored without
 * a time. A guest spot is upcoming until its last day has passed.
 */
export const guestSpot = pgTable(
  "guest_spot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    city: text("city").notNull(),
    country: text("country").notNull(),
    studioName: text("studio_name").notNull(),
    address: text("address"),
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    endsOn: date("ends_on", { mode: "string" }).notNull(),
    status: text("status", { enum: GUEST_SPOT_STATUSES }).default("open").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Both checks repeat the input schema; they protect writes that bypass it.
    check("guest_spot_dates_check", sql`${table.endsOn} >= ${table.startsOn}`),
    check("guest_spot_status_check", sql`${table.status} in (${statusList})`),
    index("guest_spot_ends_on_idx").on(table.endsOn),
  ],
);

/** Registers the guest spot table with the relational query API. It has no relations yet. */
export const guestSpotRelations = defineRelationsPart({ guestSpot });

import { defineRelationsPart, sql } from "drizzle-orm";
import { check, integer, pgTable, timestamp } from "drizzle-orm/pg-core";

/** The ID of the only travel settings row. */
export const TRAVEL_SETTINGS_ID = 1;

/**
 * The figures an admin sets for the travel estimator, in whole euros and minutes: the ways from
 * Porto airport to Braga (the bus, a rental car, and Uber) and hotels in Braga. The table has at
 * most one row; the site shows no transport or hotel figures until it exists. The `coach_*`
 * columns are the airport bus.
 */
export const travelSettings = pgTable(
  "travel_settings",
  {
    id: integer("id").primaryKey().default(TRAVEL_SETTINGS_ID),
    coachFareEuros: integer("coach_fare_euros").notNull(),
    coachMinutes: integer("coach_minutes").notNull(),
    carDayMinEuros: integer("car_day_min_euros").notNull(),
    carDayMaxEuros: integer("car_day_max_euros").notNull(),
    rideMinEuros: integer("ride_min_euros").notNull(),
    rideMaxEuros: integer("ride_max_euros").notNull(),
    driveMinutes: integer("drive_minutes").notNull(),
    hotelFromEuros: integer("hotel_from_euros").notNull(),
    hotelTypicalMinEuros: integer("hotel_typical_min_euros").notNull(),
    hotelTypicalMaxEuros: integer("hotel_typical_max_euros").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    check("travel_settings_single_row", sql`${table.id} = ${sql.raw(String(TRAVEL_SETTINGS_ID))}`),
    // The input schema checks the same rules; these protect writes that bypass it.
    check(
      "travel_settings_values_check",
      sql`${table.coachFareEuros} >= 0 and ${table.coachMinutes} > 0 and ${table.hotelFromEuros} >= 0 and ${table.hotelFromEuros} <= ${table.hotelTypicalMinEuros} and ${table.hotelTypicalMinEuros} <= ${table.hotelTypicalMaxEuros}`,
    ),
    check(
      "travel_settings_transport_check",
      sql`${table.carDayMinEuros} >= 0 and ${table.carDayMinEuros} <= ${table.carDayMaxEuros} and ${table.rideMinEuros} >= 0 and ${table.rideMinEuros} <= ${table.rideMaxEuros} and ${table.driveMinutes} > 0`,
    ),
  ],
);

/** Registers the travel settings table with the relational query API. It has no relations. */
export const travelRelations = defineRelationsPart({ travelSettings });

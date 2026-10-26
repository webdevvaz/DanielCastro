import { sql } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "../database";
import { mapDatabaseError } from "../errors";
import { TRAVEL_SETTINGS_ID, travelSettings } from "../schema/travel";

const travelSettingsColumns = {
  coachFareEuros: true,
  coachMinutes: true,
  carDayMinEuros: true,
  carDayMaxEuros: true,
  rideMinEuros: true,
  rideMaxEuros: true,
  driveMinutes: true,
  hotelFromEuros: true,
  hotelTypicalMinEuros: true,
  hotelTypicalMaxEuros: true,
} as const;

/** The travel estimator's figures, or null when an admin has not set them yet. */
export const getTravelSettings = Effect.fn("db.getTravelSettings")(function* () {
  const db = yield* Database;

  const settings = yield* db.query.travelSettings.findFirst({
    columns: travelSettingsColumns,
    where: { id: { eq: TRAVEL_SETTINGS_ID } },
  });

  return settings ?? null;
}, mapDatabaseError("getTravelSettings"));

/** Creates the travel settings row, or replaces its figures. */
export const saveTravelSettings = Effect.fn("db.saveTravelSettings")(function* (
  values: TravelSettingsValues,
) {
  const db = yield* Database;

  yield* db
    .insert(travelSettings)
    .values({ id: TRAVEL_SETTINGS_ID, ...values })
    .onConflictDoUpdate({
      target: travelSettings.id,
      set: { ...values, updatedAt: sql`now()` },
    });
}, mapDatabaseError("saveTravelSettings"));

/** The figures an admin sets for the travel estimator. */
export type TravelSettingsValues = Pick<
  typeof travelSettings.$inferInsert,
  | "coachFareEuros"
  | "coachMinutes"
  | "carDayMinEuros"
  | "carDayMaxEuros"
  | "rideMinEuros"
  | "rideMaxEuros"
  | "driveMinutes"
  | "hotelFromEuros"
  | "hotelTypicalMinEuros"
  | "hotelTypicalMaxEuros"
>;

import { layer } from "@effect/vitest";
import { count } from "drizzle-orm";
import { Effect } from "effect";
import { expect } from "vite-plus/test";

import { Database, getTravelSettings, saveTravelSettings } from "../../src";
import { travelSettings } from "../../src/schema";
import { TestDatabaseLive } from "../support/private-postgres";

const settings = {
  coachFareEuros: 10,
  coachMinutes: 50,
  carDayMinEuros: 20,
  carDayMaxEuros: 35,
  rideMinEuros: 35,
  rideMaxEuros: 55,
  driveMinutes: 40,
  hotelFromEuros: 45,
  hotelTypicalMinEuros: 60,
  hotelTypicalMaxEuros: 110,
};

const rowCount = Effect.gen(function* () {
  const db = yield* Database;

  const [result] = yield* db.select({ rows: count() }).from(travelSettings);

  return result?.rows ?? 0;
});

layer(TestDatabaseLive, { excludeTestServices: true, timeout: "60 seconds" })(
  "travel settings",
  (it) => {
    it.effect("has no figures until saved, then keeps one row that each save replaces", () =>
      Effect.gen(function* () {
        expect(yield* getTravelSettings()).toBeNull();

        yield* saveTravelSettings(settings);
        yield* saveTravelSettings({ ...settings, coachFareEuros: 12 });

        expect(yield* getTravelSettings()).toEqual({ ...settings, coachFareEuros: 12 });
        expect(yield* rowCount).toBe(1);
      }),
    );

    it.effect.each([
      { name: "a hotel range", change: { hotelTypicalMinEuros: 120 } },
      { name: "a rental car range", change: { carDayMinEuros: 40 } },
      { name: "an Uber range", change: { rideMinEuros: 60 } },
      { name: "a zero-minute drive", change: { driveMinutes: 0 } },
    ])("refuses $name out of order and keeps the saved figures", ({ change }) =>
      Effect.gen(function* () {
        yield* saveTravelSettings(settings);

        const error = yield* saveTravelSettings({ ...settings, ...change }).pipe(Effect.flip);

        expect(error._tag).toBe("DatabaseError");
        expect(yield* getTravelSettings()).toEqual(settings);
      }),
    );
  },
);

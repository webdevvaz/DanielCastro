import { layer } from "@effect/vitest";
import { Effect } from "effect";
import { expect } from "vite-plus/test";

import { insertGuestSpot, listUpcomingGuestSpots, type GuestSpotValues } from "../../src";
import { TestDatabaseLive } from "../support/private-postgres";

const TODAY = "2026-11-10";

const spot = (
  city: string,
  startsOn: string,
  endsOn: string,
  status: GuestSpotValues["status"] = "open",
): GuestSpotValues => ({
  city,
  country: "Germany",
  studioName: "Host Studio",
  address: null,
  startsOn,
  endsOn,
  status,
  note: null,
});

layer(TestDatabaseLive, { excludeTestServices: true, timeout: "60 seconds" })(
  "guest spots",
  (it) => {
    it.effect("lists spots until their last day has passed, the soonest first", () =>
      Effect.gen(function* () {
        yield* insertGuestSpot(spot("Ended yesterday", "2026-11-01", "2026-11-09"));
        yield* insertGuestSpot(spot("Later", "2026-12-01", "2026-12-05"));
        yield* insertGuestSpot(spot("Ends today", "2026-11-07", TODAY));
        yield* insertGuestSpot(spot("Runs now", "2026-11-09", "2026-11-12", "full"));

        const upcoming = yield* listUpcomingGuestSpots(TODAY);

        // The status must arrive as text: the site compares it to tell visitors whether to book.
        expect(upcoming.map(({ city, status }) => [city, status])).toEqual([
          ["Ends today", "open"],
          ["Runs now", "full"],
          ["Later", "open"],
        ]);
      }),
    );

    it.effect("refuses a backwards date range or an unknown status", () =>
      Effect.gen(function* () {
        const backwards = yield* insertGuestSpot(
          spot("Backwards", "2026-11-20", "2026-11-19"),
        ).pipe(Effect.flip);

        const unknownStatus = yield* insertGuestSpot(
          spot("Unknown", "2026-11-20", "2026-11-21", "maybe" as GuestSpotValues["status"]),
        ).pipe(Effect.flip);

        expect(backwards._tag).toBe("DatabaseError");
        expect(unknownStatus._tag).toBe("DatabaseError");
      }),
    );
  },
);

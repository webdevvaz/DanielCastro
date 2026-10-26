import { NotFoundError } from "@daniel/shared/errors";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "../database";
import { mapDatabaseError } from "../errors";
import { guestSpot } from "../schema/guest-spots";

const guestSpotColumns = {
  id: true,
  city: true,
  country: true,
  studioName: true,
  address: true,
  startsOn: true,
  endsOn: true,
  status: true,
  note: true,
} as const;

const guestSpotNotFound = () => new NotFoundError({ resource: "Guest spot" });

/**
 * Guest spots whose last day is `today` or later, the soonest first. `today` is a calendar date
 * (`yyyy-MM-dd`) in the studio's time zone.
 */
export const listUpcomingGuestSpots = Effect.fn("db.listUpcomingGuestSpots")(function* (
  today: string,
) {
  const db = yield* Database;

  return yield* db.query.guestSpot.findMany({
    columns: guestSpotColumns,
    where: { endsOn: { gte: today } },
    orderBy: { startsOn: "asc" },
  });
}, mapDatabaseError("listUpcomingGuestSpots"));

/** Every guest spot, past ones included, the latest first, for the admin area. */
export const listAllGuestSpots = Effect.fn("db.listAllGuestSpots")(function* () {
  const db = yield* Database;

  return yield* db.query.guestSpot.findMany({
    columns: guestSpotColumns,
    orderBy: { startsOn: "desc" },
  });
}, mapDatabaseError("listAllGuestSpots"));

/** Adds a guest spot and returns its ID. */
export const insertGuestSpot = Effect.fn("db.insertGuestSpot")(function* (values: GuestSpotValues) {
  const db = yield* Database;

  const inserted = yield* db.insert(guestSpot).values(values).returning({ id: guestSpot.id });

  const created = inserted.at(0);

  if (created === undefined) return yield* Effect.die(new Error("The insert returned no row"));

  return created;
}, mapDatabaseError("insertGuestSpot"));

/** Replaces every field of a guest spot. */
export const updateGuestSpot = Effect.fn("db.updateGuestSpot")(function* (
  id: string,
  values: GuestSpotValues,
) {
  const db = yield* Database;

  const updated = yield* db
    .update(guestSpot)
    .set(values)
    .where(eq(guestSpot.id, id))
    .returning({ id: guestSpot.id });

  if (updated.length === 0) return yield* guestSpotNotFound();
}, mapDatabaseError("updateGuestSpot"));

/** Deletes a guest spot. */
export const deleteGuestSpot = Effect.fn("db.deleteGuestSpot")(function* (id: string) {
  const db = yield* Database;

  const deleted = yield* db
    .delete(guestSpot)
    .where(eq(guestSpot.id, id))
    .returning({ id: guestSpot.id });

  if (deleted.length === 0) return yield* guestSpotNotFound();
}, mapDatabaseError("deleteGuestSpot"));

/** The fields an admin edits on a guest spot. Empty optional text is stored as `null`. */
export type GuestSpotValues = Pick<
  typeof guestSpot.$inferInsert,
  "city" | "country" | "studioName" | "startsOn" | "endsOn" | "status"
> & {
  readonly address: string | null;
  readonly note: string | null;
};

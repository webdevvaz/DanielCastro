import type {
  EnquiryEmailStatus,
  EnquiryLocationKind,
  EnquiryPhotoKind,
  EnquiryStatus,
} from "@daniel/shared/enquiry";
import type { Locale } from "@daniel/shared/locales";

import { NotFoundError } from "@daniel/shared/errors";
import { count, eq } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "../database";
import { mapDatabaseError } from "../errors";
import { enquiry, enquiryPhoto } from "../schema/enquiries";
import { guestSpot } from "../schema/guest-spots";

const enquirySummaryColumns = {
  id: true,
  name: true,
  instagram: true,
  theme: true,
  locationKind: true,
  locationDetail: true,
  status: true,
  emailStatus: true,
  createdAt: true,
} as const;

const enquiryNotFound = () => new NotFoundError({ resource: "Enquiry" });

/**
 * Saves an enquiry and its photos in one transaction: either both are saved or neither is. The
 * caller chooses the IDs, because the photo files are stored under them before the rows exist.
 */
export const insertEnquiry = Effect.fn("db.insertEnquiry")(function* (
  values: NewEnquiry,
  photos: ReadonlyArray<NewEnquiryPhoto>,
) {
  const db = yield* Database;

  yield* db.transaction((tx) =>
    Effect.gen(function* () {
      yield* tx.insert(enquiry).values(values);

      if (photos.length === 0) return;

      yield* tx
        .insert(enquiryPhoto)
        .values(photos.map((photo) => ({ ...photo, enquiryId: values.id })));
    }),
  );
}, mapDatabaseError("insertEnquiry"));

/** Every enquiry, the newest first, without the photos or the long text, for the admin list. */
export const listEnquiries = Effect.fn("db.listEnquiries")(function* () {
  const db = yield* Database;

  return yield* db.query.enquiry.findMany({
    columns: enquirySummaryColumns,
    orderBy: { createdAt: "desc" },
  });
}, mapDatabaseError("listEnquiries"));

/** How many enquiries nobody has answered yet. */
export const countNewEnquiries = Effect.fn("db.countNewEnquiries")(function* () {
  const db = yield* Database;

  const rows = yield* db.select({ total: count() }).from(enquiry).where(eq(enquiry.status, "new"));

  return rows.at(0)?.total ?? 0;
}, mapDatabaseError("countNewEnquiries"));

/**
 * One enquiry with every field and its photos, by kind and then position. Fails with
 * `NotFoundError` when it does not exist.
 */
export const getEnquiry = Effect.fn("db.getEnquiry")(function* (id: string) {
  const db = yield* Database;

  const found = yield* db.query.enquiry.findFirst({
    where: { id: { eq: id } },
    with: {
      photos: {
        columns: { id: true, kind: true, position: true, width: true, height: true },
        orderBy: { kind: "asc", position: "asc" },
      },
    },
  });

  if (found === undefined) return yield* enquiryNotFound();

  return found;
}, mapDatabaseError("getEnquiry"));

/** Moves an enquiry to another stage. Fails with `NotFoundError` when it does not exist. */
export const setEnquiryStatus = Effect.fn("db.setEnquiryStatus")(function* (
  id: string,
  status: EnquiryStatus,
) {
  const db = yield* Database;

  const updated = yield* db
    .update(enquiry)
    .set({ status })
    .where(eq(enquiry.id, id))
    .returning({ id: enquiry.id });

  if (updated.length === 0) return yield* enquiryNotFound();
}, mapDatabaseError("setEnquiryStatus"));

/**
 * Records whether the enquiry's email went out. Sending sets `emailSentAt`; does nothing when the
 * enquiry was deleted meanwhile.
 */
export const setEnquiryEmailStatus = Effect.fn("db.setEnquiryEmailStatus")(function* (
  id: string,
  emailStatus: EnquiryEmailStatus,
) {
  const db = yield* Database;

  yield* db
    .update(enquiry)
    .set({ emailStatus, emailSentAt: emailStatus === "sent" ? new Date() : null })
    .where(eq(enquiry.id, id));
}, mapDatabaseError("setEnquiryEmailStatus"));

/**
 * Deletes an enquiry and its photo rows and returns the photo IDs, so the caller can delete the
 * stored files. Fails with `NotFoundError` when it does not exist.
 */
export const deleteEnquiry = Effect.fn("db.deleteEnquiry")(function* (id: string) {
  const db = yield* Database;

  return yield* db.transaction((tx) =>
    Effect.gen(function* () {
      const photos = yield* tx
        .select({ id: enquiryPhoto.id })
        .from(enquiryPhoto)
        .where(eq(enquiryPhoto.enquiryId, id));

      const deleted = yield* tx
        .delete(enquiry)
        .where(eq(enquiry.id, id))
        .returning({ id: enquiry.id });

      if (deleted.length === 0) return yield* enquiryNotFound();

      return photos.map((photo) => photo.id);
    }),
  );
}, mapDatabaseError("deleteEnquiry"));

/**
 * One guest spot that a client may choose: it exists and its last day is `today` or later.
 * Returns null otherwise. `today` is a calendar date (`yyyy-MM-dd`) in the studio's time zone.
 */
export const findBookableGuestSpot = Effect.fn("db.findBookableGuestSpot")(function* (
  id: string,
  today: string,
) {
  const db = yield* Database;

  const rows = yield* db
    .select({
      id: guestSpot.id,
      city: guestSpot.city,
      country: guestSpot.country,
      studioName: guestSpot.studioName,
      startsOn: guestSpot.startsOn,
      endsOn: guestSpot.endsOn,
    })
    .from(guestSpot)
    .where(eq(guestSpot.id, id));

  const spot = rows.at(0);

  return spot !== undefined && spot.endsOn >= today ? spot : null;
}, mapDatabaseError("findBookableGuestSpot"));

/** The fields of a new enquiry, with the ID its photo files are stored under. */
export type NewEnquiry = {
  readonly id: string;
  readonly locale: Locale;
  readonly name: string;
  readonly age: number;
  readonly instagram: string;
  readonly email: string;
  readonly phone: string | null;
  readonly city: string;
  readonly country: string;
  readonly locationKind: EnquiryLocationKind;
  readonly guestSpotId: string | null;
  readonly locationDetail: string | null;
  readonly theme: string;
  readonly description: string;
  readonly questions: string | null;
  readonly emailStatus: EnquiryEmailStatus;
  readonly consentedAt: Date;
};

/** A stored photo of a new enquiry. */
export type NewEnquiryPhoto = {
  readonly id: string;
  readonly kind: EnquiryPhotoKind;
  readonly position: number;
  readonly width: number;
  readonly height: number;
};

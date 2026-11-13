import "@tanstack/react-start/server-only";
import type { EnquiryDetails, UpdateEnquiryStatusInput } from "@daniel/shared/enquiry";

import {
  deleteEnquiry,
  findBookableGuestSpot,
  getEnquiry,
  insertEnquiry,
  setEnquiryEmailStatus,
  setEnquiryStatus,
} from "@daniel/db";
import {
  ENQUIRY_PHOTO_KINDS,
  EnquiryDetails as EnquiryDetailsSchema,
} from "@daniel/shared/enquiry";
import { ConflictError, InvalidInputError } from "@daniel/shared/errors";
import { studioToday } from "@daniel/shared/studio";
import { Config, Effect, Option, Schema } from "effect";
import { randomUUID } from "node:crypto";

import { enquiryPhotoFileName } from "@/enquiries/enquiry-files";

import { readyEmailSettings, sendWithSettings } from "../email/email-settings.server";
import { readPhotoUpload } from "../gallery/photo-image.server";
import { PhotoStorage } from "../gallery/photo-storage.server";
import { withAuditEvent } from "../observability/audit.server";
import {
  buildEnquiryEmail,
  type EnquiryEmailContent,
  type EnquiryEmailPhoto,
} from "./enquiry-email.server";
import { processEnquiryPhoto, removeEnquiryFiles } from "./enquiry-photos.server";

/** Photos are resized two at a time, so a large enquiry does not hold every image in memory. */
const PHOTO_CONCURRENCY = 2;

const decodeDetails = Schema.decodeUnknownEffect(Schema.fromJsonString(EnquiryDetailsSchema));

const notReady = () =>
  new ConflictError({ reason: "Save the sender, the recipients, and the Resend API key first" });

/**
 * Where the client wants the tattoo, as stored: the studio, a guest spot that has not ended, or
 * the place they named. Fails with `ConflictError` when the guest spot ended or was deleted after
 * the form loaded.
 */
const resolveLocation = Effect.fn("resolveLocation")(function* (details: EnquiryDetails) {
  if (details.location === "braga") {
    return { locationKind: "braga", guestSpotId: null, locationDetail: null } as const;
  }

  if (details.location === "other") {
    return {
      locationKind: "other",
      guestSpotId: null,
      locationDetail: details.locationOther,
    } as const;
  }

  const spot = yield* findBookableGuestSpot(details.location, studioToday());

  if (spot === null) {
    return yield* new ConflictError({ reason: "That guest spot is no longer available" });
  }

  return {
    locationKind: "guest_spot",
    guestSpotId: spot.id,
    locationDetail: `${spot.city}, ${spot.country} – ${spot.studioName}, ${spot.startsOn} – ${spot.endsOn}`,
  } as const;
});

/** The site's address, for the link in the email. */
const siteUrl = Config.String("BETTER_AUTH_URL");

/**
 * Sends the studio's email about an enquiry and records the outcome. Sending is best effort: a
 * failure is logged and recorded, and the enquiry stays saved for the admin area.
 */
const deliverEnquiryEmail = (
  enquiry: EnquiryEmailContent,
  photos: ReadonlyArray<EnquiryEmailPhoto>,
) =>
  Effect.gen(function* () {
    const settings = yield* readyEmailSettings;

    if (Option.isNone(settings)) return yield* notReady();

    const email = buildEnquiryEmail(enquiry, photos, yield* siteUrl);

    yield* sendWithSettings(settings.value, email).pipe(
      Effect.tapError(() => setEnquiryEmailStatus(enquiry.id, "failed")),
    );

    yield* setEnquiryEmailStatus(enquiry.id, "sent");
  }).pipe(Effect.withSpan("deliverEnquiryEmail", { attributes: { enquiryId: enquiry.id } }));

/**
 * Saves an enquiry from the site's form, with its photos, then emails the studio. The photos are
 * checked by their content, resized, and stored before the rows are written; when a step fails,
 * the stored files are deleted again and nothing is saved. Without email settings, the enquiry is
 * saved as not emailed; when sending fails, as failed. Either way the client sees success, and an
 * admin can send the email later.
 */
export const submitEnquiry = Effect.fn("submitEnquiry")(function* (formData: FormData) {
  const details = yield* decodeDetails(formData.get("details")).pipe(
    Effect.mapError(() => new InvalidInputError({ reason: "Fill in every required field" })),
  );

  const location = yield* resolveLocation(details);

  const settings = yield* readyEmailSettings;

  const id = randomUUID();

  const uploads = ENQUIRY_PHOTO_KINDS.flatMap((kind) =>
    formData.getAll(kind).map((entry, position) => ({ id: randomUUID(), kind, position, entry })),
  );

  const storage = yield* PhotoStorage;

  const content: EnquiryEmailContent = {
    id,
    locale: details.locale,
    name: details.name,
    age: details.age,
    instagram: details.instagram.replace(/^@/, ""),
    email: details.email,
    phone: details.phone === "" ? null : details.phone,
    city: details.city,
    country: details.country,
    locationKind: location.locationKind,
    locationDetail: location.locationDetail,
    theme: details.theme,
    description: details.description,
    questions: details.questions === "" ? null : details.questions,
  };

  const photos = yield* Effect.gen(function* () {
    const stored = yield* Effect.forEach(
      uploads,
      (upload) =>
        Effect.gen(function* () {
          const bytes = yield* readPhotoUpload(upload.entry);
          const photo = yield* processEnquiryPhoto(bytes);

          yield* storage.put(enquiryPhotoFileName(id, upload.id), photo.bytes);

          return { ...upload, ...photo };
        }),
      { concurrency: PHOTO_CONCURRENCY },
    );

    yield* insertEnquiry(
      {
        ...content,
        guestSpotId: location.guestSpotId,
        emailStatus: Option.isSome(settings) ? "failed" : "not_configured",
        consentedAt: new Date(),
      },
      stored.map((photo) => ({
        id: photo.id,
        kind: photo.kind,
        position: photo.position,
        width: photo.width,
        height: photo.height,
      })),
    );

    return stored;
  }).pipe(
    Effect.onError(() =>
      removeEnquiryFiles(
        id,
        uploads.map((upload) => upload.id),
      ),
    ),
  );

  yield* Effect.logInfo("Enquiry received").pipe(Effect.annotateLogs({ enquiryId: id }));

  if (Option.isNone(settings)) return;

  yield* deliverEnquiryEmail(content, photos).pipe(
    Effect.catchCause((cause) =>
      Effect.logWarning("Could not email the enquiry", cause).pipe(
        Effect.annotateLogs({ enquiryId: id }),
      ),
    ),
  );
});

/** Moves an enquiry to another stage: new, quoted, booked, or declined. */
export const changeEnquiryStatus = Effect.fn("changeEnquiryStatus")(
  function* (_userId: string, input: UpdateEnquiryStatusInput) {
    yield* setEnquiryStatus(input.id, input.status);
  },
  (effect, userId, input) =>
    effect.pipe(
      withAuditEvent({
        action: "enquiry.status_changed",
        actorUserId: userId,
        targetType: "enquiry",
        targetId: input.id,
      }),
    ),
);

/**
 * Sends an enquiry's email again, for one received before the email settings existed or one whose
 * email failed. Fails with `ConflictError` when the settings are incomplete or Resend refuses.
 */
export const sendEnquiryEmailAgain = Effect.fn("sendEnquiryEmailAgain")(
  function* (_userId: string, id: string) {
    const enquiry = yield* getEnquiry(id);

    const storage = yield* PhotoStorage;

    const photos = yield* Effect.forEach(
      enquiry.photos,
      (photo) =>
        storage
          .read(enquiryPhotoFileName(enquiry.id, photo.id))
          .pipe(
            Effect.map((bytes) =>
              bytes === null ? [] : [{ kind: photo.kind, position: photo.position, bytes }],
            ),
          ),
      { concurrency: PHOTO_CONCURRENCY },
    );

    yield* deliverEnquiryEmail(enquiry, photos.flat());
  },
  (effect, userId, id) =>
    effect.pipe(
      withAuditEvent({
        action: "enquiry.email_sent_again",
        actorUserId: userId,
        targetType: "enquiry",
        targetId: id,
      }),
    ),
);

/** Deletes an enquiry and its stored photos. */
export const removeEnquiry = Effect.fn("removeEnquiry")(
  function* (_userId: string, id: string) {
    const photoIds = yield* deleteEnquiry(id);

    yield* removeEnquiryFiles(id, photoIds);
  },
  (effect, userId, id) =>
    effect.pipe(
      withAuditEvent({
        action: "enquiry.deleted",
        actorUserId: userId,
        targetType: "enquiry",
        targetId: id,
      }),
    ),
);

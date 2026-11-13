import { Schema } from "effect";

import { SiteLocale } from "./locales";
import { EmailAddress, numberInput, optionalText, requiredText } from "./schema-fields";

/** The youngest client the studio tattoos (PRODUCT.md, "Policies"). */
export const ENQUIRY_MIN_AGE = 18;

/** Where an enquiry stands for the studio team. */
export const ENQUIRY_STATUSES = ["new", "quoted", "booked", "declined"] as const;

/** Where the client wants the tattoo: the studio, an upcoming guest spot, or somewhere else. */
export const ENQUIRY_LOCATION_KINDS = ["braga", "guest_spot", "other"] as const;

/** Whether an enquiry's email went out, failed, or could not go out without email settings. */
export const ENQUIRY_EMAIL_STATUSES = ["sent", "failed", "not_configured"] as const;

/** The photos an enquiry carries: visual references, Daniel's works the client likes, and the placement. */
export const ENQUIRY_PHOTO_KINDS = ["reference", "favourite", "placement"] as const;

/** How many photos of each kind an enquiry needs and may have, as on the studio's Google Form. */
export const ENQUIRY_PHOTO_LIMITS: Record<EnquiryPhotoKind, { min: number; max: number }> = {
  reference: { min: 1, max: 10 },
  favourite: { min: 1, max: 10 },
  placement: { min: 1, max: 5 },
};

/**
 * The largest photo the server accepts. The form shrinks photos in the browser first, to about
 * 2000 pixels, so a phone's photo arrives well below this.
 */
export const ENQUIRY_PHOTO_MAX_BYTES = 8 * 1024 * 1024;

/** Image types the form sends. */
export const ENQUIRY_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** One stage of an enquiry. */
export const EnquiryStatus = Schema.Literals(ENQUIRY_STATUSES);

/** One kind of enquiry photo. */
export const EnquiryPhotoKind = Schema.Literals(ENQUIRY_PHOTO_KINDS);

/** An enquiry ID (a UUID). */
export const EnquiryId = Schema.String.check(Schema.isUUID());

/** An Instagram username, with or without the @. */
const InstagramHandle = Schema.Trim.check(
  Schema.isPattern(/^@?[A-Za-z0-9._]{1,30}$/, { message: "Enter your Instagram @username" }),
);

/** "braga", "other", or the ID of an upcoming guest spot. */
const LocationChoice = Schema.Union([Schema.Literals(["braga", "other"]), EnquiryId]);

/** "Other" needs a place. */
const otherPlaceGiven = Schema.makeFilter(
  (details: { readonly location: string; readonly locationOther: string }) =>
    details.location !== "other" ||
    details.locationOther !== "" || { path: ["locationOther"], issue: "Enter the place" },
);

/**
 * What a client writes in the enquiry form, without the photos. `consent` is the privacy notice
 * checkbox; `website` is a field that people never see and bots fill in, so it must stay empty.
 * `secondsToFill` is how long the form was open before sending; the server ignores an enquiry
 * sent faster than a person can fill it in.
 */
export const EnquiryDetails = Schema.Struct({
  locale: SiteLocale,
  name: requiredText("Name", 120),
  age: numberInput(
    Schema.Int.check(
      Schema.isBetween(
        { minimum: ENQUIRY_MIN_AGE, maximum: 120 },
        { message: `You must be ${ENQUIRY_MIN_AGE} or older` },
      ),
    ),
    "Enter your age",
  ),
  instagram: InstagramHandle,
  email: EmailAddress,
  phone: optionalText("Phone", 40),
  city: requiredText("City", 80),
  country: requiredText("Country", 80),
  location: LocationChoice,
  locationOther: optionalText("Other place", 120),
  theme: requiredText("Theme", 200),
  description: requiredText("Description", 3000),
  questions: optionalText("Questions", 3000),
  consent: Schema.Boolean.check(
    Schema.makeFilter((consent: boolean) => consent || "Accept the privacy notice"),
  ),
  website: Schema.String.check(Schema.isMaxLength(0)),
  secondsToFill: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
}).check(otherPlaceGiven);

const decodeDetails = Schema.decodeUnknownOption(Schema.fromJsonString(EnquiryDetails));

const isPhotoFile = (entry: FormDataEntryValue) =>
  entry instanceof File &&
  entry.size > 0 &&
  entry.size <= ENQUIRY_PHOTO_MAX_BYTES &&
  ENQUIRY_PHOTO_TYPES.some((type) => type === entry.type);

/** Every photo field holds between its minimum and maximum of acceptable images. */
const photosWithinLimits = (data: FormData) =>
  ENQUIRY_PHOTO_KINDS.every((kind) => {
    const files = data.getAll(kind);
    const { min, max } = ENQUIRY_PHOTO_LIMITS[kind];

    return files.length >= min && files.length <= max && files.every(isPhotoFile);
  });

/**
 * The multipart body of an enquiry: the details as JSON in `details`, and the photos in the
 * `reference`, `favourite`, and `placement` fields.
 */
export const EnquiryFormData = Schema.instanceOf(FormData).pipe(
  Schema.check(
    Schema.makeFilter((data: FormData) => decodeDetails(data.get("details"))._tag === "Some", {
      message: "Fill in every required field",
    }),
    Schema.makeFilter(photosWithinLimits, {
      message: "Add the photos the form asks for: JPG, PNG, or WebP images",
    }),
  ),
);

/** Moves an enquiry to another stage. */
export const UpdateEnquiryStatusInput = Schema.Struct({
  id: EnquiryId,
  status: EnquiryStatus,
});

/** Names one enquiry. */
export const EnquiryIdInput = Schema.Struct({
  id: EnquiryId,
});

/** Decoded enquiry details. */
export type EnquiryDetails = typeof EnquiryDetails.Type;

/** One stage of an enquiry. */
export type EnquiryStatus = typeof EnquiryStatus.Type;

/** Decoded stage change. */
export type UpdateEnquiryStatusInput = typeof UpdateEnquiryStatusInput.Type;

/** One kind of enquiry photo. */
export type EnquiryPhotoKind = typeof EnquiryPhotoKind.Type;

/** Where the client wants the tattoo. */
export type EnquiryLocationKind = (typeof ENQUIRY_LOCATION_KINDS)[number];

/** Whether an enquiry's email went out. */
export type EnquiryEmailStatus = (typeof ENQUIRY_EMAIL_STATUSES)[number];

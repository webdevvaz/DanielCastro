import {
  ENQUIRY_EMAIL_STATUSES,
  ENQUIRY_LOCATION_KINDS,
  ENQUIRY_PHOTO_KINDS,
  ENQUIRY_STATUSES,
} from "@daniel/shared/enquiry";
import { LOCALES } from "@daniel/shared/locales";
import { defineRelationsPart, sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { guestSpot } from "./guest-spots";

// Lists for the checks. The columns are text with a check rather than Postgres enums: the driver
// reads results in the binary format and returns a user-defined type, such as an enum, as raw
// bytes.
const listOf = (values: ReadonlyArray<string>) =>
  sql.raw(values.map((value) => `'${value}'`).join(", "));

/** The ID of the only email settings row. */
export const EMAIL_SETTINGS_ID = 1;

/**
 * Tattoo enquiries sent through the site's form. `locale` is the language the client wrote in.
 * `locationDetail` keeps what the client chose in words: the guest spot as it was when they
 * wrote, or the other place they named; it is null for the studio in Braga. `emailStatus` says
 * whether the studio's email went out.
 */
export const enquiry = pgTable(
  "enquiry",
  {
    id: uuid("id").primaryKey(),
    locale: text("locale", { enum: LOCALES }).notNull(),
    name: text("name").notNull(),
    age: integer("age").notNull(),
    instagram: text("instagram").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    city: text("city").notNull(),
    country: text("country").notNull(),
    locationKind: text("location_kind", { enum: ENQUIRY_LOCATION_KINDS }).notNull(),
    guestSpotId: uuid("guest_spot_id").references(() => guestSpot.id, { onDelete: "set null" }),
    locationDetail: text("location_detail"),
    theme: text("theme").notNull(),
    description: text("description").notNull(),
    questions: text("questions"),
    status: text("status", { enum: ENQUIRY_STATUSES }).default("new").notNull(),
    emailStatus: text("email_status", { enum: ENQUIRY_EMAIL_STATUSES }).notNull(),
    emailSentAt: timestamp("email_sent_at"),
    // When the client accepted the privacy notice; the form cannot be sent without it.
    consentedAt: timestamp("consented_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // The checks repeat the input schema; they protect writes that bypass it.
    check("enquiry_locale_check", sql`${table.locale} in (${listOf(LOCALES)})`),
    check("enquiry_status_check", sql`${table.status} in (${listOf(ENQUIRY_STATUSES)})`),
    check(
      "enquiry_email_status_check",
      sql`${table.emailStatus} in (${listOf(ENQUIRY_EMAIL_STATUSES)})`,
    ),
    check(
      "enquiry_location_check",
      sql`${table.locationKind} in (${listOf(ENQUIRY_LOCATION_KINDS)}) and (${table.locationKind} = 'braga') = (${table.locationDetail} is null) and (${table.locationKind} = 'guest_spot' or ${table.guestSpotId} is null)`,
    ),
    check("enquiry_age_check", sql`${table.age} >= 18`),
    index("enquiry_created_at_idx").on(table.createdAt),
  ],
);

/**
 * The photos of an enquiry, each stored as one JPEG named after the enquiry and photo IDs (see
 * the web app's `enquiries/enquiry-files.ts`). Lower `position` comes first within a kind.
 */
export const enquiryPhoto = pgTable(
  "enquiry_photo",
  {
    id: uuid("id").primaryKey(),
    enquiryId: uuid("enquiry_id")
      .notNull()
      .references(() => enquiry.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ENQUIRY_PHOTO_KINDS }).notNull(),
    position: integer("position").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
  },
  (table) => [
    check("enquiry_photo_kind_check", sql`${table.kind} in (${listOf(ENQUIRY_PHOTO_KINDS)})`),
    index("enquiry_photo_enquiry_id_idx").on(table.enquiryId),
  ],
);

/**
 * Who sends and receives enquiry emails, and the Resend API key that sends them. The table has at
 * most one row. `resendKeyCiphertext` is the key encrypted by the web app; `resendKeyHint` is its
 * last four characters, the only part an admin sees again. No email goes out until the sender,
 * the recipients, and the key are all set.
 */
export const emailSettings = pgTable(
  "email_settings",
  {
    id: integer("id").primaryKey().default(EMAIL_SETTINGS_ID),
    sender: text("sender"),
    recipients: text("recipients"),
    resendKeyCiphertext: text("resend_key_ciphertext"),
    resendKeyHint: text("resend_key_hint"),
    updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    check("email_settings_single_row", sql`${table.id} = ${sql.raw(String(EMAIL_SETTINGS_ID))}`),
    check(
      "email_settings_key_check",
      sql`(${table.resendKeyCiphertext} is null) = (${table.resendKeyHint} is null)`,
    ),
  ],
);

/** Relations of the enquiry tables. */
export const enquiryRelations = defineRelationsPart({ enquiry, enquiryPhoto }, (r) => ({
  enquiry: {
    photos: r.many.enquiryPhoto({ from: r.enquiry.id, to: r.enquiryPhoto.enquiryId }),
  },
  enquiryPhoto: {
    enquiry: r.one.enquiry({ from: r.enquiryPhoto.enquiryId, to: r.enquiry.id }),
  },
}));

/** Registers the email settings table with the relational query API. It has no relations. */
export const emailSettingsRelations = defineRelationsPart({ emailSettings });

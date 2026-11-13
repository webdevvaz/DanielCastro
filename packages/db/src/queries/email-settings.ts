import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "../database";
import { mapDatabaseError } from "../errors";
import { EMAIL_SETTINGS_ID, emailSettings } from "../schema/enquiries";

/** Writes fields of the only settings row, creating the row the first time. */
const upsertEmailSettings = (values: Partial<typeof emailSettings.$inferInsert>) =>
  Effect.gen(function* () {
    const db = yield* Database;

    yield* db
      .insert(emailSettings)
      .values({ id: EMAIL_SETTINGS_ID, ...values })
      .onConflictDoUpdate({ target: emailSettings.id, set: values });
  });

/**
 * The email settings with the encrypted Resend key, or null before an admin saved any. The
 * ciphertext is for server code only; never return it to a browser.
 */
export const getEmailSettings = Effect.fn("db.getEmailSettings")(function* () {
  const db = yield* Database;

  const settings = yield* db.query.emailSettings.findFirst({
    columns: {
      sender: true,
      recipients: true,
      resendKeyCiphertext: true,
      resendKeyHint: true,
      updatedAt: true,
    },
    where: { id: { eq: EMAIL_SETTINGS_ID } },
  });

  return settings ?? null;
}, mapDatabaseError("getEmailSettings"));

/** Saves who sends and who receives enquiry emails. */
export const saveEmailAddresses = Effect.fn("db.saveEmailAddresses")(function* (
  values: EmailAddresses,
) {
  yield* upsertEmailSettings(values);
}, mapDatabaseError("saveEmailAddresses"));

/** Saves a new encrypted Resend key and its last four characters, replacing any key before. */
export const saveResendKey = Effect.fn("db.saveResendKey")(function* (values: StoredResendKey) {
  yield* upsertEmailSettings(values);
}, mapDatabaseError("saveResendKey"));

/** Forgets the Resend key; no email goes out until an admin saves another. */
export const clearResendKey = Effect.fn("db.clearResendKey")(function* (updatedBy: string) {
  const db = yield* Database;

  yield* db
    .update(emailSettings)
    .set({ resendKeyCiphertext: null, resendKeyHint: null, updatedBy })
    .where(eq(emailSettings.id, EMAIL_SETTINGS_ID));
}, mapDatabaseError("clearResendKey"));

/** The sender and the comma-separated recipients, and the admin who set them. */
export type EmailAddresses = {
  readonly sender: string;
  readonly recipients: string;
  readonly updatedBy: string;
};

/** An encrypted Resend key, its last four characters, and the admin who saved it. */
export type StoredResendKey = {
  readonly resendKeyCiphertext: string;
  readonly resendKeyHint: string;
  readonly updatedBy: string;
};

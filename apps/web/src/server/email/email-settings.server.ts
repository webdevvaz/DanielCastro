import "@tanstack/react-start/server-only";
import type { SaveEmailSettingsInput } from "@daniel/shared/email-settings";

import { clearResendKey, getEmailSettings, saveEmailAddresses, saveResendKey } from "@daniel/db";
import { recipientList } from "@daniel/shared/email-settings";
import { ConflictError, ServiceUnavailableError } from "@daniel/shared/errors";
import { Effect, Option, Redacted } from "effect";

import { withAuditEvent } from "../observability/audit.server";
import { Resend, type OutgoingEmail } from "./resend.server";
import { SecretBox } from "./secret-box.server";

/** How many characters of the key an admin sees again. */
const KEY_HINT_LENGTH = 4;

const notReady = () =>
  new ConflictError({ reason: "Save the sender, the recipients, and the Resend API key first" });

/**
 * Sends one email with the saved settings. Resend's refusal reaches the admin with its reason,
 * such as a domain that is not verified yet; any other failure says Resend is unavailable.
 */
export const sendWithSettings = Effect.fn("sendWithSettings")(function* (
  settings: ReadyEmailSettings,
  email: Omit<OutgoingEmail, "from" | "to">,
) {
  const resend = yield* Resend;

  return yield* resend
    .send(settings.apiKey, { ...email, from: settings.sender, to: settings.recipients })
    .pipe(
      Effect.catchTags({
        ResendRejected: (error) =>
          Effect.fail(new ConflictError({ reason: `Resend refused the email: ${error.reason}` })),
        ResendError: (error) =>
          Effect.logWarning("Resend failed", error.cause).pipe(
            Effect.andThen(Effect.fail(new ServiceUnavailableError({ service: "Resend" }))),
          ),
      }),
    );
});

/**
 * The settings that send enquiry emails, or none when the sender, the recipients, or the Resend
 * key is missing. A key that can no longer be opened (`BETTER_AUTH_SECRET` changed) counts as
 * missing and is logged.
 */
export const readyEmailSettings = Effect.gen(function* () {
  const settings = yield* getEmailSettings();

  if (
    settings === null ||
    settings.sender === null ||
    settings.recipients === null ||
    settings.resendKeyCiphertext === null
  ) {
    return Option.none<ReadyEmailSettings>();
  }

  const box = yield* SecretBox;

  const apiKey = yield* box.open(settings.resendKeyCiphertext).pipe(
    Effect.tapError(() => Effect.logWarning("The saved Resend API key cannot be decrypted")),
    Effect.option,
  );

  return Option.map(apiKey, (key): ReadyEmailSettings => ({
    sender: settings.sender ?? "",
    recipients: recipientList(settings.recipients ?? ""),
    apiKey: key,
  }));
}).pipe(Effect.withSpan("readyEmailSettings"));

/**
 * What the admin's email page shows. The key itself never leaves the server: only its last four
 * characters, and whether it can still be read.
 */
export const getEmailSettingsView = Effect.fn("getEmailSettingsView")(function* () {
  const settings = yield* getEmailSettings();

  const box = yield* SecretBox;

  const ciphertext = settings?.resendKeyCiphertext ?? null;

  const keyReadable =
    ciphertext !== null && Option.isSome(yield* box.open(ciphertext).pipe(Effect.option));

  const key: EmailSettingsView["key"] =
    ciphertext === null ? "missing" : keyReadable ? "saved" : "unreadable";

  const sender = settings?.sender ?? "";
  const recipients = settings?.recipients ?? "";

  return {
    sender,
    recipients,
    key,
    keyHint: settings?.resendKeyHint ?? null,
    ready: key === "saved" && sender !== "" && recipients !== "",
  } satisfies EmailSettingsView;
});

/** Saves who sends and who receives enquiry emails. Recipients are stored as `a@x.com, b@y.com`. */
export const updateEmailAddresses = Effect.fn("updateEmailAddresses")(
  function* (userId: string, input: SaveEmailSettingsInput) {
    yield* saveEmailAddresses({
      sender: input.sender,
      recipients: recipientList(input.recipients).join(", "),
      updatedBy: userId,
    });
  },
  (effect, userId) =>
    effect.pipe(
      withAuditEvent({
        action: "email.addresses_updated",
        actorUserId: userId,
        targetType: "email_settings",
      }),
    ),
);

/** Encrypts and saves a new Resend API key, replacing the old one. */
export const replaceResendKey = Effect.fn("replaceResendKey")(
  function* (userId: string, apiKey: Redacted.Redacted) {
    const box = yield* SecretBox;

    const resendKeyCiphertext = yield* box.seal(apiKey);

    yield* saveResendKey({
      resendKeyCiphertext,
      resendKeyHint: Redacted.value(apiKey).slice(-KEY_HINT_LENGTH),
      updatedBy: userId,
    });
  },
  (effect, userId) =>
    effect.pipe(
      withAuditEvent({
        action: "email.key_saved",
        actorUserId: userId,
        targetType: "email_settings",
      }),
    ),
);

/** Forgets the Resend API key. Enquiries are still saved; their emails wait for a new key. */
export const removeResendKey = Effect.fn("removeResendKey")(
  function* (userId: string) {
    yield* clearResendKey(userId);
  },
  (effect, userId) =>
    effect.pipe(
      withAuditEvent({
        action: "email.key_removed",
        actorUserId: userId,
        targetType: "email_settings",
      }),
    ),
);

/** Sends a short test email to the recipients, so the admin sees the settings work. */
export const sendTestEmail = Effect.fn("sendTestEmail")(
  function* (_userId: string) {
    const settings = yield* readyEmailSettings;

    if (Option.isNone(settings)) return yield* notReady();

    yield* sendWithSettings(settings.value, {
      replyTo: Option.none(),
      subject: "Teste do site / Website test",
      text: "Os emails dos pedidos de orçamento chegam a este endereço.\n\nEnquiry emails arrive at this address.",
      html: "<p>Os emails dos pedidos de orçamento chegam a este endereço.</p><p>Enquiry emails arrive at this address.</p>",
      attachments: [],
    });
  },
  (effect, userId) =>
    effect.pipe(
      withAuditEvent({
        action: "email.test_sent",
        actorUserId: userId,
        targetType: "email_settings",
      }),
    ),
);

/** Settings complete enough to send: a sender, one or more recipients, and the opened key. */
export type ReadyEmailSettings = {
  readonly sender: string;
  readonly recipients: ReadonlyArray<string>;
  readonly apiKey: Redacted.Redacted;
};

/** The admin's view of the email settings. */
export type EmailSettingsView = {
  readonly sender: string;
  readonly recipients: string;
  /** Whether a key is saved, and whether it can still be read. */
  readonly key: "missing" | "saved" | "unreadable";
  /** The key's last four characters, such as `x9Qa`. */
  readonly keyHint: string | null;
  /** Whether enquiry emails can go out. */
  readonly ready: boolean;
};

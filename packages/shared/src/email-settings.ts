import { Schema } from "effect";

import { EmailAddress } from "./schema-fields";

/** Most addresses that receive each enquiry. */
const MAX_RECIPIENTS = 5;

const isEmailAddress = Schema.is(EmailAddress);

/** `Name <address>`, with the address in angle brackets. */
const NAMED_ADDRESS = /^[^<>]*<([^<>]+)>$/;

/** The address part of a sender, such as `enquiries@example.com` in `Daniel <enquiries@example.com>`. */
const senderAddress = (sender: string) => NAMED_ADDRESS.exec(sender)?.at(1)?.trim() ?? sender;

/** The addresses in a comma-separated list, trimmed, without empty entries. */
export const recipientList = (value: string) =>
  value
    .split(",")
    .map((address) => address.trim())
    .filter((address) => address !== "");

/**
 * Who enquiries come from: an address on a domain verified in Resend, alone or with a name, such
 * as `Daniel Castro <enquiries@danielcastro.tattoo>`.
 */
export const EmailSender = Schema.Trim.check(
  Schema.isMaxLength(200),
  Schema.makeFilter(
    (sender: string) =>
      isEmailAddress(senderAddress(sender)) ||
      "Enter an address such as Daniel Castro <enquiries@example.com>",
  ),
);

/** Who receives each enquiry: one to five addresses, separated by commas. */
export const EmailRecipients = Schema.Trim.check(
  Schema.makeFilter((value: string) => {
    const addresses = recipientList(value);

    return (
      (addresses.length > 0 &&
        addresses.length <= MAX_RECIPIENTS &&
        addresses.every((address) => isEmailAddress(address))) ||
      `Enter one to ${MAX_RECIPIENTS} email addresses, separated by commas`
    );
  }),
);

/** The sender and recipients of enquiry emails. */
export const SaveEmailSettingsInput = Schema.Struct({
  sender: EmailSender,
  recipients: EmailRecipients,
});

/** A new Resend API key. Resend keys start with `re_`. */
export const SaveResendKeyInput = Schema.Struct({
  apiKey: Schema.Trim.check(
    Schema.isPattern(/^re_[A-Za-z0-9_]{8,200}$/, { message: "A Resend API key starts with re_" }),
  ),
});

/** Decoded sender and recipients. */
export type SaveEmailSettingsInput = typeof SaveEmailSettingsInput.Type;

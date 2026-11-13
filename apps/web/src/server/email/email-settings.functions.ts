import { SaveEmailSettingsInput, SaveResendKeyInput } from "@daniel/shared/email-settings";
import { createServerFn } from "@tanstack/react-start";
import { Redacted } from "effect";

import { adminMiddleware } from "../auth/auth.middleware";
import { runServerEffect } from "../run.server";
import { validateInput } from "../validate-input";
import {
  getEmailSettingsView,
  removeResendKey,
  replaceResendKey,
  sendTestEmail as sendTestEmailEffect,
  updateEmailAddresses,
} from "./email-settings.server";

/** The email settings, with only the last four characters of the Resend key. */
export const getEmailSettings = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(() => runServerEffect(getEmailSettingsView()));

/** Saves who sends and who receives enquiry emails. */
export const saveEmailSettings = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(SaveEmailSettingsInput))
  .handler(({ context, data }) => runServerEffect(updateEmailAddresses(context.user.id, data)));

/** Saves a new Resend API key. The key is encrypted and never sent back. */
export const saveResendApiKey = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(SaveResendKeyInput))
  .handler(({ context, data }) =>
    runServerEffect(replaceResendKey(context.user.id, Redacted.make(data.apiKey))),
  );

/** Forgets the Resend API key. */
export const deleteResendApiKey = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .handler(({ context }) => runServerEffect(removeResendKey(context.user.id)));

/** Sends a test email to the recipients. */
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .handler(({ context }) => runServerEffect(sendTestEmailEffect(context.user.id)));

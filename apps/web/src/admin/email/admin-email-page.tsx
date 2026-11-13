import { SaveEmailSettingsInput, SaveResendKeyInput } from "@daniel/shared/email-settings";
import { revalidateLogic } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Schema } from "effect";
import { toast } from "sonner";

import { useAppForm } from "@/forms/form";
import { showFormError } from "@/forms/server-errors";
import { emailSettingsQueryKeys } from "@/integrations/tanstack-query/email-settings-query-options";
import {
  deleteResendApiKey,
  saveEmailSettings,
  saveResendApiKey,
  sendTestEmail,
} from "@/server/email/email-settings.functions";

import { useAdminText } from "../use-admin-text";

/**
 * Where enquiry emails come from and go to, and the Resend API key that sends them. The key is
 * write-only: the page shows its last four characters, never the key.
 */
export function AdminEmailPage() {
  const context = useRouteContext({ from: "/admin/_dashboard/email" });

  const { t } = useAdminText();
  const m = t.email;

  const { data: settings } = useSuspenseQuery(context.emailSettingsQueryOptions);

  const saveAddresses = useServerFn(saveEmailSettings);
  const saveKey = useServerFn(saveResendApiKey);
  const removeKey = useServerFn(deleteResendApiKey);
  const sendTest = useServerFn(sendTestEmail);

  const refresh = () =>
    context.queryClient.invalidateQueries({ queryKey: emailSettingsQueryKeys.all });

  const addressesMutation = useMutation({
    mutationFn: (value: typeof SaveEmailSettingsInput.Encoded) => saveAddresses({ data: value }),
    onSuccess: refresh,
  });

  const keyMutation = useMutation({
    mutationFn: (value: typeof SaveResendKeyInput.Encoded) => saveKey({ data: value }),
    onSuccess: refresh,
  });

  const removeKeyMutation = useMutation({
    mutationFn: () => removeKey(),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || m.removeFailed),
  });

  const testMutation = useMutation({
    mutationFn: () => sendTest(),
    onError: (error) => toast.error(error.message || m.testFailed),
  });

  const addressesForm = useAppForm({
    defaultValues: { sender: settings.sender, recipients: settings.recipients },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(SaveEmailSettingsInput) },
    onSubmit: async ({ value }) => {
      await addressesMutation
        .mutateAsync(value)
        .catch((error: unknown) => showFormError(addressesForm, error, m.saveFailed));
    },
  });

  const keyForm = useAppForm({
    defaultValues: { apiKey: "" },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(SaveResendKeyInput) },
    onSubmit: async ({ value }) => {
      await keyMutation
        .mutateAsync(value)
        .then(() => keyForm.reset())
        .catch((error: unknown) => showFormError(keyForm, error, m.keyFailed));
    },
  });

  const keyStatus = {
    missing: m.keyMissing,
    saved: m.keySaved(settings.keyHint ?? ""),
    unreadable: m.keyUnreadable,
  }[settings.key];

  return (
    <>
      <p className="eyebrow">
        <b>{t.nav.label}</b> {m.title}
      </p>
      <h1>{m.title}</h1>
      <p className="lead">{m.lead}</p>
      <p className="panel admin-notice" data-ready={settings.ready}>
        {settings.ready ? m.ready : m.notReady}
      </p>

      <section className="admin-section">
        <h2>{m.addressesTitle}</h2>
        <form
          className="form panel"
          onSubmit={(event) => {
            event.preventDefault();

            void addressesForm.handleSubmit();
          }}
        >
          <addressesForm.AppField name="sender">
            {(field) => <field.TextField label={m.sender} hint={m.senderHint} />}
          </addressesForm.AppField>
          <addressesForm.AppField name="recipients">
            {(field) => <field.TextField label={m.recipients} hint={m.recipientsHint} />}
          </addressesForm.AppField>
          <div className="actions">
            <button className="btn btn-red" type="submit" disabled={addressesMutation.isPending}>
              {addressesMutation.isPending ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-section">
        <h2>{m.keyTitle}</h2>
        <form
          className="form panel"
          onSubmit={(event) => {
            event.preventDefault();

            void keyForm.handleSubmit();
          }}
        >
          <p>{keyStatus}</p>
          <keyForm.AppField name="apiKey">
            {(field) => (
              <field.TextField
                label={m.newKey}
                hint={m.keyHint}
                type="password"
                autoComplete="off"
                placeholder="re_…"
              />
            )}
          </keyForm.AppField>
          <div className="actions">
            <button className="btn btn-red" type="submit" disabled={keyMutation.isPending}>
              {keyMutation.isPending ? t.common.saving : m.saveKey}
            </button>
            {settings.key === "missing" ? null : (
              <button
                className="btn btn-danger"
                type="button"
                disabled={removeKeyMutation.isPending}
                onClick={() => {
                  if (window.confirm(m.confirmRemoveKey)) removeKeyMutation.mutate();
                }}
              >
                {m.removeKey}
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-section">
        <h2>{m.testTitle}</h2>
        <p>{m.testLead}</p>
        <div className="actions">
          <button
            className="btn btn-ghost"
            type="button"
            disabled={!settings.ready || testMutation.isPending}
            onClick={() => testMutation.mutate()}
          >
            {testMutation.isPending ? m.sendingTest : m.sendTest}
          </button>
        </div>
      </section>

      <section className="admin-section">
        <h2>{m.setupTitle}</h2>
        <ol className="admin-steps">
          {m.setupSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </>
  );
}

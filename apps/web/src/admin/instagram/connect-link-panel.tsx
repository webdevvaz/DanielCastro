import { CreateInstagramConnectLinkInput } from "@daniel/shared/instagram";
import { revalidateLogic } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { Schema } from "effect";
import { useState } from "react";

import { appConfig } from "@/app-config";
import { useAppForm } from "@/forms/form";
import { showFormError } from "@/forms/server-errors";
import { DATE_LOCALES } from "@/i18n/locales";
import { createInstagramConnectLink } from "@/server/instagram/instagram.functions";

import { useAdminText } from "../use-admin-text";

/** The studio's Instagram username, from the Instagram link in the site settings. */
const STUDIO_USERNAME =
  new URL(appConfig.links.instagram).pathname.split("/").find((part) => part !== "") ?? "";

/**
 * Creates a link that Daniel opens on his phone to connect his Instagram account without an admin
 * account. The link works for one account and for 7 days.
 */
export function ConnectLinkPanel() {
  const { locale, t } = useAdminText();
  const i = t.instagram;

  const [copied, setCopied] = useState(false);

  const create = useServerFn(createInstagramConnectLink);

  const mutation = useMutation({
    mutationFn: (value: typeof CreateInstagramConnectLinkInput.Encoded) => create({ data: value }),
    onSuccess: () => setCopied(false),
  });

  const defaultValues: typeof CreateInstagramConnectLinkInput.Encoded = {
    username: STUDIO_USERNAME,
  };

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(CreateInstagramConnectLinkInput) },
    onSubmit: async ({ value }) => {
      await mutation
        .mutateAsync(value)
        .catch((error: unknown) => showFormError(form, error, i.linkFailed));
    },
  });

  const link = mutation.data;

  return (
    <div className="panel">
      <p>{i.linkText}</p>
      <form
        className="form connect-link-form"
        onSubmit={(event) => {
          event.preventDefault();

          void form.handleSubmit();
        }}
      >
        <form.AppField name="username">
          {(field) => <field.TextField label={i.linkUsername} placeholder="@" autoComplete="off" />}
        </form.AppField>
        <button className="btn btn-red btn-small" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? i.linkCreating : i.linkCreate}
        </button>
      </form>
      {link === undefined ? null : (
        <div className="connect-link-result">
          <input
            className="input"
            readOnly
            value={link.url}
            aria-label={i.linkTitle}
            onFocus={(event) => event.target.select()}
          />
          <button
            className="btn btn-ghost btn-small"
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(link.url).then(() => setCopied(true));
            }}
          >
            {copied ? i.linkCopied : i.linkCopy}
          </button>
          <p className="field-hint">
            {i.linkValidUntil(
              format(link.expiresAt, "d MMM yyyy", { locale: DATE_LOCALES[locale] }),
            )}
          </p>
        </div>
      )}
    </div>
  );
}

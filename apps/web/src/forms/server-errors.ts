import type { AnyFormApi } from "@tanstack/react-form";

import { InvalidInputError } from "@daniel/shared/errors";
import { toast } from "sonner";

const ARRAY_INDEX = /^\d+$/;

/** Turns a schema issue path such as `["owners", "0", "id"]` into a form field name: `owners[0].id`. */
const toFieldName = (path: ReadonlyArray<string>) =>
  path.reduce((name, segment) => {
    if (ARRAY_INDEX.test(segment)) return `${name}[${segment}]`;

    return name === "" ? segment : `${name}.${segment}`;
  }, "");

/**
 * Shows the issues of an `InvalidInputError` on the matching form fields. Each message stays until
 * the user edits that field or submits again, like a client-side submit error.
 *
 * Returns the issues that match no field of this form, so the caller can show them elsewhere.
 */
export function applyServerIssues(form: FormFieldMeta, error: unknown) {
  if (!(error instanceof InvalidInputError)) return [];

  const unmatched: Array<{ readonly path: ReadonlyArray<string>; readonly message: string }> = [];

  for (const issue of error.issues ?? []) {
    const fieldName = toFieldName(issue.path);

    if (fieldName === "" || form.getFieldMeta(fieldName) === undefined) {
      unmatched.push(issue);

      continue;
    }

    form.setFieldMeta(fieldName, (meta) => ({
      ...meta,
      isTouched: true,
      errorMap: { ...meta.errorMap, onSubmit: { message: issue.message } },
    }));
  }

  return unmatched;
}

/**
 * Reports a failed form submission. Field issues from the server appear on their fields; any other
 * failure (or an issue that matches no field) appears as a toast with the server's message, or
 * `fallbackMessage` when there is none.
 *
 * ```ts
 * onSubmit: async ({ value }) => {
 *   await mutation.mutateAsync(value).catch((error: unknown) =>
 *     showFormError(form, error, "The report could not be saved"),
 *   );
 * },
 * ```
 */
export function showFormError(form: FormFieldMeta, error: unknown, fallbackMessage: string) {
  const unmatched = applyServerIssues(form, error);

  const handledOnFields =
    error instanceof InvalidInputError && (error.issues?.length ?? 0) > 0 && unmatched.length === 0;

  if (handledOnFields) return;

  const message = error instanceof Error && error.message !== "" ? error.message : fallbackMessage;

  toast.error(message);
}

/** The part of a TanStack Form instance these helpers use. */
type FormFieldMeta = Pick<AnyFormApi, "getFieldMeta" | "setFieldMeta">;

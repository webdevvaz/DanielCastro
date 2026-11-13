import { authClient } from "@daniel/auth/client";
import { SignInInput } from "@daniel/shared/auth";
import { revalidateLogic } from "@tanstack/react-form";
import { noop, useMutation } from "@tanstack/react-query";
import { useNavigate, useRouteContext, useSearch } from "@tanstack/react-router";
import { Schema } from "effect";
import { useState } from "react";

import { useAppForm } from "@/forms/form";
import { clearQueryCacheForAuthTransition } from "@/integrations/tanstack-query/auth-cache";

import { useAdminText } from "./use-admin-text";

/**
 * Email and password sign-in for the studio team, in the admin language. Opens the requested admin
 * page afterwards. Any failure shows the same message, so it never tells which part was wrong.
 */
export function SignInForm() {
  const { queryClient } = useRouteContext({ from: "/admin/sign-in" });
  const { redirect } = useSearch({ from: "/admin/sign-in" });
  const navigate = useNavigate();

  const { t } = useAdminText();

  const [authError, setAuthError] = useState<string | null>(null);

  const signInMutation = useMutation({
    mutationFn: async (value: SignInInput) => {
      // Better Auth reports failures in `error` instead of rejecting.
      const { error } = await authClient.signIn.email(value);

      if (error) throw new Error(t.signIn.invalid);
    },
    onSuccess: async () => {
      clearQueryCacheForAuthTransition(queryClient);

      await navigate({ href: redirect ?? "/admin" });
    },
    onError: (error) => {
      setAuthError(error.message || t.signIn.invalid);
    },
  });

  const defaultValues: SignInInput = { email: "", password: "" };

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(SignInInput) },
    onSubmit: async ({ value }) => {
      setAuthError(null);

      await signInMutation.mutateAsync(value).catch(noop);
    },
  });

  return (
    <form
      className="form"
      method="post"
      onSubmit={(event) => {
        event.preventDefault();

        void form.handleSubmit();
      }}
    >
      <form.AppField name="email">
        {(field) => <field.TextField label={t.signIn.email} type="email" autoComplete="email" />}
      </form.AppField>
      <form.AppField name="password">
        {(field) => (
          <field.TextField
            label={t.signIn.password}
            type="password"
            autoComplete="current-password"
          />
        )}
      </form.AppField>
      {authError ? (
        <p className="form-error" role="alert">
          {authError}
        </p>
      ) : null}
      <button className="btn btn-red" type="submit" disabled={signInMutation.isPending}>
        {signInMutation.isPending ? t.signIn.submitting : t.signIn.submit}
      </button>
    </form>
  );
}

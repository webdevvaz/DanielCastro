import { SignInSearch } from "@daniel/shared/auth";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { Schema } from "effect";

import { AdminLanguageSwitch } from "@/admin/admin-language-switch";
import { ADMIN_TEXT } from "@/admin/admin-text";
import { SignInForm } from "@/admin/sign-in-form";
import { useAdminText } from "@/admin/use-admin-text";
import { localeParam } from "@/i18n/locales";
import { getSessionQueryOptions } from "@/integrations/tanstack-query/auth-query-options";

function SignInPage() {
  const { locale, t } = useAdminText();

  return (
    <main className="sign-in" lang={locale}>
      <div className="sign-in-card">
        <Link to="/{-$locale}" params={{ locale: localeParam(locale) }} aria-label={t.signIn.home}>
          <img src="/assets/brand/badge-white.webp" alt="" width={900} height={736} />
        </Link>
        <p className="eyebrow">{t.signIn.eyebrow}</p>
        <h1>{t.signIn.title}</h1>
        <SignInForm />
        <AdminLanguageSwitch />
      </div>
    </main>
  );
}

/**
 * The studio team's sign-in page, in the admin language. Signed-in users go straight to the admin
 * area.
 */
export const Route = createFileRoute("/admin/sign-in")({
  validateSearch: Schema.toStandardSchemaV1(SignInSearch),
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.query({
      ...getSessionQueryOptions,
      staleTime: "static",
    });

    if (session) throw redirect({ href: search.redirect ?? "/admin", replace: true });
  },
  head: ({ match }) => ({
    meta: [
      { title: ADMIN_TEXT[match.context.adminLocale].signIn.pageTitle },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignInPage,
});

import { SignInSearch } from "@daniel/shared/auth";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { Schema } from "effect";

import { SignInForm } from "@/admin/sign-in-form";
import { getSessionQueryOptions } from "@/integrations/tanstack-query/auth-query-options";

function SignInPage() {
  return (
    <main className="sign-in">
      <div className="sign-in-card">
        <Link to="/" aria-label="Home page">
          <img src="/assets/brand/badge-white.webp" alt="" width={900} height={736} />
        </Link>
        <p className="eyebrow">
          <b>Studio</b> Admin
        </p>
        <h1>Sign in</h1>
        <SignInForm />
      </div>
    </main>
  );
}

/** The studio team's sign-in page. Signed-in users go straight to the admin area. */
export const Route = createFileRoute("/admin/sign-in")({
  validateSearch: Schema.toStandardSchemaV1(SignInSearch),
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.query({
      ...getSessionQueryOptions,
      staleTime: "static",
    });

    if (session) throw redirect({ href: search.redirect ?? "/admin", replace: true });
  },
  head: () => ({
    meta: [{ title: "Sign in — Daniel Castro" }, { name: "robots", content: "noindex" }],
  }),
  component: SignInPage,
});

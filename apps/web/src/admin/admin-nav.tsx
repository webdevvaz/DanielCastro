import { Link, useRouteContext } from "@tanstack/react-router";

import { localeParam } from "@/i18n/locales";
import { useSignOut } from "@/integrations/tanstack-query/use-sign-out";

import { AdminLanguageSwitch } from "./admin-language-switch";
import { useAdminText } from "./use-admin-text";

/**
 * The admin area's navigation, the signed-in user, the language switch, and sign-out. "View
 * site" opens the public site in the admin language.
 */
export function AdminNav() {
  const context = useRouteContext({ from: "/admin/_dashboard" });

  const { locale, t } = useAdminText();

  const signOut = useSignOut(context.queryClient, t.nav.signOutFailed);

  return (
    <nav className="admin-nav" aria-label={t.nav.label}>
      <Link to="/admin" aria-label={t.nav.overviewLabel}>
        <img src="/assets/brand/wordmark-white.webp" alt="" width={600} height={226} />
      </Link>
      <Link to="/admin" activeOptions={{ exact: true }}>
        {t.nav.overview}
      </Link>
      <Link to="/admin/enquiries">{t.nav.enquiries}</Link>
      <Link to="/admin/gallery">{t.nav.gallery}</Link>
      <Link to="/admin/guest-spots">{t.nav.guestSpots}</Link>
      <Link to="/admin/travel">{t.nav.travel}</Link>
      <Link to="/admin/instagram">{t.nav.instagram}</Link>
      <Link to="/admin/email">{t.nav.email}</Link>
      <div className="admin-nav-end">
        <p className="admin-nav-user">{context.user.email}</p>
        <AdminLanguageSwitch />
        <Link to="/{-$locale}" params={{ locale: localeParam(locale) }}>
          {t.nav.viewSite}
        </Link>
        <button type="button" disabled={signOut.isPending} onClick={() => signOut.mutate()}>
          {signOut.isPending ? t.nav.signingOut : t.nav.signOut}
        </button>
      </div>
    </nav>
  );
}

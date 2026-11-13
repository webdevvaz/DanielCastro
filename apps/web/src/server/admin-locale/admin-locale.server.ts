import "@tanstack/react-start/server-only";
import { Effect } from "effect";

import { ADMIN_LOCALE_COOKIE, DEFAULT_ADMIN_LOCALE, isAdminLocale } from "@/i18n/admin-locales";
import { cookieValue } from "@/i18n/cookie-value";

import { RequestHeaders } from "../request-headers.server";

/** The admin language from the request's cookie; Portuguese when none is chosen. */
export const readAdminLocale = Effect.gen(function* () {
  const headers = yield* RequestHeaders;

  const value = cookieValue(headers.get("cookie"), ADMIN_LOCALE_COOKIE);

  return isAdminLocale(value) ? value : DEFAULT_ADMIN_LOCALE;
});

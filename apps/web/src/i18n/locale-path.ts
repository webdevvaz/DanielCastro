import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";

/** The first segment of a path, such as `pt` in `/pt/about`; empty for `/`. */
const firstSegment = (pathname: string) => pathname.split("/").at(1) ?? "";

/** The language that a path's prefix names, or null for a path without one. */
export const localeOfPath = (pathname: string) => {
  const segment = firstSegment(pathname);

  return isLocale(segment) && segment !== DEFAULT_LOCALE ? segment : null;
};

/** A public path without its language prefix: `/pt/about` becomes `/about`, `/pt` becomes `/`. */
export const pathWithoutLocale = (pathname: string) => {
  if (localeOfPath(pathname) === null) return pathname;

  const rest = pathname.slice(firstSegment(pathname).length + 1);

  return rest === "" ? "/" : rest;
};

/** A path without a prefix in a language: `/about` in Portuguese is `/pt/about`. */
export const localizedPath = (locale: Locale, pathname: string) => {
  if (locale === DEFAULT_LOCALE) return pathname;

  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
};

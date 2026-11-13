import { cookieValue } from "./cookie-value";
import { localeOfPath, localizedPath } from "./locale-path";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./locales";

/** First path segments that are not public pages, so they never move to a language. */
const NOT_PAGES = new Set(["admin", "api", "_serverFn", "assets", "src", "node_modules", "@vite"]);

/** The language subtag of a language tag: `pt` in `pt-PT`. */
const primarySubtag = (tag: string) => tag.trim().toLowerCase().split("-").at(0) ?? "";

/**
 * The site language the browser prefers most, from `Accept-Language` (`pt-PT,pt;q=0.9,en;q=0.8`),
 * or null when it names none of the site's languages. A language without `q` has the weight 1.
 */
const preferredLocale = (header: string | null): Locale | null => {
  if (header === null) return null;

  const ranked = header
    .split(",")
    .map((entry) => {
      const [tag = "", ...parameters] = entry.split(";");
      const weight = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith("q="));

      return {
        language: primarySubtag(tag),
        weight: weight === undefined ? 1 : Number(weight.slice(2)),
      };
    })
    .filter((entry) => Number.isFinite(entry.weight) && entry.weight > 0)
    .toSorted((left, right) => right.weight - left.weight);

  const match = ranked.find((entry) => isLocale(entry.language));

  return match === undefined || !isLocale(match.language) ? null : match.language;
};

/** The language the visitor chose in the switcher, from the `locale` cookie, or null. */
const chosenLocale = (cookieHeader: string | null): Locale | null => {
  const value = cookieValue(cookieHeader, LOCALE_COOKIE);

  return isLocale(value) ? value : null;
};

/** Whether a request is a browser opening a public page without a language prefix. */
const isUnprefixedPageRequest = (request: Request, url: URL) => {
  if (request.method !== "GET" && request.method !== "HEAD") return false;

  if (!(request.headers.get("accept") ?? "").includes("text/html")) return false;

  const firstSegment = url.pathname.split("/").at(1) ?? "";
  const lastSegment = url.pathname.split("/").at(-1) ?? "";

  // A file, such as `/robots.txt` or `/favicon.ico`, is not a page.
  if (NOT_PAGES.has(firstSegment) || lastSegment.includes(".")) return false;

  return localeOfPath(url.pathname) === null;
};

/**
 * Where to send a browser that opens a public page without a language prefix, or null to serve
 * it in English. The language chosen in the switcher (the cookie) comes first; without a choice,
 * the browser's preferred language decides. Admin pages, server functions, API routes, files, and
 * addresses that already name a language are never redirected.
 */
export function localeRedirectTarget(request: Request) {
  const url = new URL(request.url);

  if (!isUnprefixedPageRequest(request, url)) return null;

  const locale =
    chosenLocale(request.headers.get("cookie")) ??
    preferredLocale(request.headers.get("accept-language")) ??
    DEFAULT_LOCALE;

  if (locale === DEFAULT_LOCALE) return null;

  return `${localizedPath(locale, url.pathname)}${url.search}`;
}

import { describe, expect, it } from "vite-plus/test";

import { localeRedirectTarget } from "../../src/i18n/locale-redirect";

const HTML = "text/html,application/xhtml+xml";

const requestFor = (path: string, headers: Record<string, string>, method = "GET") =>
  new Request(`http://localhost:3000${path}`, { method, headers });

/**
 * The first-visit language redirect runs on every request. A wrong answer would move admin pages,
 * API calls, or server functions to an address that does not exist, or ignore the language a
 * visitor chose in the switcher.
 */
describe("localeRedirectTarget", () => {
  it.each<RedirectCase>([
    {
      name: "a Portuguese browser opening the home page",
      path: "/",
      headers: { accept: HTML, "accept-language": "pt-PT,pt;q=0.9,en;q=0.8" },
      target: "/pt",
    },
    {
      name: "a German browser opening a page with a search",
      path: "/travel?from=Berlin",
      headers: { accept: HTML, "accept-language": "de-DE,de;q=0.9" },
      target: "/de/travel?from=Berlin",
    },
    {
      name: "a browser that prefers a site language by weight",
      path: "/about",
      headers: { accept: HTML, "accept-language": "it;q=1, en;q=0.5, es-MX;q=0.9" },
      target: "/es/about",
    },
    {
      name: "an English browser",
      path: "/about",
      headers: { accept: HTML, "accept-language": "en-GB,en;q=0.9,pt;q=0.8" },
      target: null,
    },
    {
      name: "a browser with no site language",
      path: "/about",
      headers: { accept: HTML, "accept-language": "it-IT,ja;q=0.5" },
      target: null,
    },
    {
      name: "a search engine without a language",
      path: "/about",
      headers: { accept: HTML },
      target: null,
    },
    {
      name: "a Portuguese browser that chose English in the switcher",
      path: "/about",
      headers: { accept: HTML, "accept-language": "pt-PT", cookie: "theme=dark; locale=en" },
      target: null,
    },
    {
      name: "an English browser that chose French in the switcher",
      path: "/aftercare",
      headers: { accept: HTML, "accept-language": "en", cookie: "locale=fr" },
      target: "/fr/aftercare",
    },
    {
      name: "an unknown cookie value, which falls back to the browser",
      path: "/",
      headers: { accept: HTML, "accept-language": "de", cookie: "locale=xx" },
      target: "/de",
    },
    {
      name: "an address that already names a language",
      path: "/fr/about",
      headers: { accept: HTML, "accept-language": "pt-PT", cookie: "locale=de" },
      target: null,
    },
  ])("$name", ({ path, headers, target }) => {
    expect(localeRedirectTarget(requestFor(path, headers))).toBe(target);
  });

  it.each([
    { name: "the admin area", path: "/admin/gallery", method: "GET", accept: HTML },
    { name: "an API route", path: "/api/health", method: "GET", accept: HTML },
    { name: "a server function", path: "/_serverFn/abc", method: "POST", accept: "*/*" },
    { name: "a file", path: "/favicon.ico", method: "GET", accept: HTML },
    {
      name: "a stored photo",
      path: "/api/photos/gallery/x-large.webp",
      method: "GET",
      accept: HTML,
    },
    { name: "a form post", path: "/about", method: "POST", accept: HTML },
    { name: "a script or data request", path: "/about", method: "GET", accept: "*/*" },
  ])("never redirects $name, even for a Portuguese browser", ({ path, method, accept }) => {
    const request = requestFor(path, { accept, "accept-language": "pt-PT" }, method);

    expect(localeRedirectTarget(request)).toBeNull();
  });
});

type RedirectCase = {
  readonly name: string;
  readonly path: string;
  readonly headers: Record<string, string>;
  readonly target: string | null;
};

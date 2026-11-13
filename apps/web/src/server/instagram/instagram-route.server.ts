import "@tanstack/react-start/server-only";
import { Effect, Option } from "effect";
import { randomBytes, timingSafeEqual } from "node:crypto";

import { getRequestSession } from "../auth/session.server";
import { plainTextResponse } from "../plain-text-response";
import { InstagramApi } from "./instagram-api.server";
import { readConnectLinkToken } from "./instagram-connect-link.server";
import { connectInstagram } from "./instagram.server";

/**
 * A random value that ties Instagram's answer to the browser that asked: Instagram sends it
 * back, and only this browser has it in a cookie. Another site cannot connect its own account.
 */
const STATE_COOKIE = "instagram_oauth_state";

/** The cookie goes only to the connect and callback routes. */
const STATE_COOKIE_PATH = "/api/instagram";

/** Ten minutes to log in to Instagram. */
const STATE_MAX_AGE_SECONDS = 600;

const ADMIN_PAGE = "/admin/instagram";
const FAILED_PAGE = `${ADMIN_PAGE}?connect=failed`;
const SIGN_IN_PAGE = "/admin/sign-in";

/**
 * The state cookie. `SameSite=Lax` sends it on the redirect back from Instagram, which is a
 * top-level navigation. Browsers accept `Secure` cookies on `http://localhost` too.
 */
const stateCookie = (value: string, maxAgeSeconds: number) =>
  [
    `${STATE_COOKIE}=${value}`,
    `Path=${STATE_COOKIE_PATH}`,
    `Max-Age=${String(maxAgeSeconds)}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");

const clearedStateCookie = stateCookie("", 0);

const redirectTo = (location: string, cookie: string) =>
  new Response(null, {
    status: 302,
    headers: { Location: location, "Set-Cookie": cookie, "Cache-Control": "no-store" },
  });

const readCookie = (headers: Headers, name: string) => {
  const entries = (headers.get("cookie") ?? "").split(";").map((part) => part.trim());
  const prefix = `${name}=`;

  return entries.find((entry) => entry.startsWith(prefix))?.slice(prefix.length) ?? null;
};

/** Compares in constant time, so the response time tells nothing about the expected value. */
const sameState = (expected: string, received: string) => {
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);

  return (
    expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes)
  );
};

/** The signed-in admin, or the response for anyone else. */
const requireAdminUser = Effect.gen(function* () {
  const session = yield* getRequestSession;

  if (session === null) return redirectTo(SIGN_IN_PAGE, clearedStateCookie);

  if (session.user.role !== "admin") {
    return plainTextResponse("You are not allowed to perform this action", 403);
  }

  return session.user;
});

/** Logs an unexpected failure and sends the admin back with an error. */
const failedConnection = <E, R>(effect: Effect.Effect<Response, E, R>) =>
  effect.pipe(
    Effect.catchCause((cause) =>
      Effect.logError("Could not connect Instagram", cause).pipe(
        Effect.as(redirectTo(FAILED_PAGE, clearedStateCookie)),
      ),
    ),
  );

/** Separates the state from a connect link's token in the state cookie. */
const LINK_SEPARATOR = "~";

/** The page a connect link opens, with the outcome of the login. */
const linkPage = (token: string, result: ConnectLinkResult) =>
  `/admin/connect-instagram/${encodeURIComponent(token)}?result=${result}`;

/**
 * `GET /api/instagram/connect`: starts Instagram Login. A signed-in admin starts it from the admin
 * page. With `?link=<token>`, anyone holding a valid connect link starts it without signing in;
 * the token then rides in the state cookie, so the callback knows which account it may connect.
 */
export const startInstagramConnection = Effect.fn("instagram.startConnection")(function* (
  request: Request,
) {
  const linkToken = new URL(request.url).searchParams.get("link");

  if (linkToken !== null) {
    const link = yield* readConnectLinkToken(linkToken);

    if (Option.isNone(link)) return redirectTo(linkPage(linkToken, "failed"), clearedStateCookie);
  } else {
    const admin = yield* requireAdminUser;

    if (admin instanceof Response) return admin;
  }

  const api = yield* InstagramApi;
  const state = randomBytes(32).toString("base64url");
  const authorizeUrl = api.authorizeUrl(state);

  if (authorizeUrl === null) return redirectTo(FAILED_PAGE, clearedStateCookie);

  const cookieValue = linkToken === null ? state : `${state}${LINK_SEPARATOR}${linkToken}`;

  return redirectTo(authorizeUrl, stateCookie(cookieValue, STATE_MAX_AGE_SECONDS));
}, failedConnection);

/**
 * Finishes a login that a connect link started: connects the account only when the link is still
 * valid and the account is the one the link names. Sends Daniel back to the link page with the
 * outcome.
 */
const finishLinkConnection = Effect.fn("instagram.finishLinkConnection")(function* (
  linkToken: string,
  params: URLSearchParams,
) {
  const link = yield* readConnectLinkToken(linkToken);

  if (Option.isNone(link)) return redirectTo(linkPage(linkToken, "failed"), clearedStateCookie);

  if (params.has("error")) return redirectTo(linkPage(linkToken, "cancelled"), clearedStateCookie);

  const code = params.get("code");

  if (code === null) return redirectTo(linkPage(linkToken, "failed"), clearedStateCookie);

  // Instagram adds `#_` to the code; it is not part of it.
  return yield* connectInstagram(link.value.by, code.replace(/#_$/, ""), link.value.username).pipe(
    Effect.as(redirectTo(linkPage(linkToken, "connected"), clearedStateCookie)),
    Effect.catchTag("ConflictError", () =>
      Effect.succeed(redirectTo(linkPage(linkToken, "wrong_account"), clearedStateCookie)),
    ),
    Effect.catchCause((cause) =>
      Effect.logError("Could not connect Instagram from a connect link", cause).pipe(
        Effect.as(redirectTo(linkPage(linkToken, "failed"), clearedStateCookie)),
      ),
    ),
  );
});

/**
 * `GET /api/instagram/callback`: finishes Instagram Login. Connects the account only when the
 * answer carries the state this browser was given, and then only for a signed-in admin or a
 * valid connect link. A cancelled login changes nothing.
 */
export const finishInstagramConnection = Effect.fn("instagram.finishConnection")(function* (
  request: Request,
) {
  const params = new URL(request.url).searchParams;
  const cookie = readCookie(request.headers, STATE_COOKIE);
  const [expected, linkToken] = (cookie ?? "").split(LINK_SEPARATOR);
  const received = params.get("state");

  if (
    expected === undefined ||
    expected === "" ||
    received === null ||
    !sameState(expected, received)
  ) {
    yield* Effect.logWarning("Instagram Login returned without the expected state");

    return redirectTo(FAILED_PAGE, clearedStateCookie);
  }

  if (linkToken !== undefined) return yield* finishLinkConnection(linkToken, params);

  const admin = yield* requireAdminUser;

  if (admin instanceof Response) return admin;

  if (params.has("error")) return redirectTo(ADMIN_PAGE, clearedStateCookie);

  const code = params.get("code");

  if (code === null) return redirectTo(FAILED_PAGE, clearedStateCookie);

  // Instagram adds `#_` to the code; it is not part of it.
  yield* connectInstagram(admin.id, code.replace(/#_$/, ""), null);

  return redirectTo(ADMIN_PAGE, clearedStateCookie);
}, failedConnection);

/** How a login from a connect link ended, as the link page shows it. */
export type ConnectLinkResult = "connected" | "cancelled" | "wrong_account" | "failed";

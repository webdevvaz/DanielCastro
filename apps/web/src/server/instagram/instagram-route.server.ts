import "@tanstack/react-start/server-only";
import { Effect } from "effect";
import { randomBytes, timingSafeEqual } from "node:crypto";

import { getRequestSession } from "../auth/session.server";
import { plainTextResponse } from "../plain-text-response";
import { InstagramApi } from "./instagram-api.server";
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

/**
 * `GET /api/instagram/connect`: starts Instagram Login for a signed-in admin. Sets the state
 * cookie and sends the admin to Instagram.
 */
export const startInstagramConnection = Effect.gen(function* () {
  const admin = yield* requireAdminUser;

  if (admin instanceof Response) return admin;

  const api = yield* InstagramApi;
  const state = randomBytes(32).toString("base64url");
  const authorizeUrl = api.authorizeUrl(state);

  if (authorizeUrl === null) return redirectTo(FAILED_PAGE, clearedStateCookie);

  return redirectTo(authorizeUrl, stateCookie(state, STATE_MAX_AGE_SECONDS));
}).pipe(failedConnection, Effect.withSpan("instagram.startConnection"));

/**
 * `GET /api/instagram/callback`: finishes Instagram Login. Connects the account only when the
 * answer carries the state this browser was given, and only for a signed-in admin. A cancelled
 * login changes nothing.
 */
export const finishInstagramConnection = Effect.fn("instagram.finishConnection")(function* (
  request: Request,
) {
  const admin = yield* requireAdminUser;

  if (admin instanceof Response) return admin;

  const params = new URL(request.url).searchParams;
  const expected = readCookie(request.headers, STATE_COOKIE);
  const received = params.get("state");

  if (expected === null || received === null || !sameState(expected, received)) {
    yield* Effect.logWarning("Instagram Login returned without the expected state");

    return redirectTo(FAILED_PAGE, clearedStateCookie);
  }

  if (params.has("error")) return redirectTo(ADMIN_PAGE, clearedStateCookie);

  const code = params.get("code");

  if (code === null) return redirectTo(FAILED_PAGE, clearedStateCookie);

  // Instagram adds `#_` to the code; it is not part of it.
  yield* connectInstagram(admin.id, code.replace(/#_$/, ""));

  return redirectTo(ADMIN_PAGE, clearedStateCookie);
}, failedConnection);

import { Auth, layer as AuthLayer } from "@daniel/auth";
import {
  Database,
  deleteInstagramConnection,
  getInstagramConnection,
  listAllGalleryPhotos,
  saveInstagramConnection,
} from "@daniel/db";
import { instagramConnection } from "@daniel/db/schema";
import { TestDatabaseLive, TestDatabaseUrl } from "@daniel/db/testing";
import { layer } from "@effect/vitest";
import { addDays, subDays, subHours } from "date-fns";
import { ConfigProvider, Deferred, Effect, Layer } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, expect } from "vite-plus/test";

import { PhotoStorageLive } from "../../src/server/gallery/photo-storage.server";
import { InstagramApiLive } from "../../src/server/instagram/instagram-api.server";
import {
  finishInstagramConnection,
  startInstagramConnection,
} from "../../src/server/instagram/instagram-route.server";
import {
  getInstagramAdminView,
  getNewsFeed,
  importInstagramPost,
} from "../../src/server/instagram/instagram.server";
import { RequestHeaders } from "../../src/server/request-headers.server";

const BASE_URL = "http://localhost:3000";
const PASSWORD = "DanielTest1!";

const APP_ID = "1234567890";
const APP_SECRET = "test-instagram-app-secret";

const ACCOUNT_ID = "17841400000000000";
const USERNAME = "danielcastro_tattooartist";

const SHORT_TOKEN = "short-lived-token";
const LONG_TOKEN = "long-lived-token";
const RENEWED_TOKEN = "renewed-token";

/** About 60 days, as Instagram gives long-lived tokens. */
const TOKEN_SECONDS = 5_183_944;

const IMAGE_URL = "https://scontent.cdninstagram.com/v/t51/photo.jpg?token=abc";

const photoDirectory = mkdtempSync(join(tmpdir(), "daniel-instagram-"));

afterAll(() => rmSync(photoDirectory, { recursive: true, force: true }));

const TestConfigLive = Layer.unwrap(
  Effect.gen(function* () {
    const databaseUrl = yield* TestDatabaseUrl;

    return ConfigProvider.layer(
      ConfigProvider.fromUnknown({
        BETTER_AUTH_SECRET: "integration-test-secret-with-32-characters",
        BETTER_AUTH_URL: BASE_URL,
        DATABASE_URL: databaseUrl,
        NODE_ENV: "test",
        PHOTO_STORAGE_DIR: photoDirectory,
      }),
    );
  }),
);

const TestAppLive = Layer.mergeAll(AuthLayer, PhotoStorageLive).pipe(
  Layer.provide(TestConfigLive),
  Layer.provideMerge(TestDatabaseLive),
);

const jpeg = await sharp({
  create: { width: 1080, height: 1350, channels: 3, background: "#c1121f" },
})
  .jpeg()
  .toBuffer();

/** A fresh media ID, so tests that share the cluster never import the same post. */
const newMediaId = () => String(Math.floor(Math.random() * 1e15));

const media = (id: string, mediaType: string, extra: Record<string, unknown> = {}) => ({
  id,
  media_type: mediaType,
  media_url: IMAGE_URL,
  permalink: `https://www.instagram.com/p/${id}/`,
  timestamp: "2026-10-20T18:30:00+0000",
  caption: "Fresh flash",
  ...extra,
});

const json = (body: unknown, status = 200): Answer => ({ status, body: JSON.stringify(body) });

/** Instagram as it answers when everything works, for the posts in `posts`. */
const workingInstagram =
  (posts: ReadonlyArray<ReturnType<typeof media>> = []) =>
  (request: SeenRequest): Answer | Effect.Effect<Answer> => {
    const { url } = request;

    if (url.hostname === "api.instagram.com") {
      return json({ data: [{ access_token: SHORT_TOKEN, user_id: ACCOUNT_ID }] });
    }

    if (url.pathname === "/access_token") {
      return json({ access_token: LONG_TOKEN, token_type: "bearer", expires_in: TOKEN_SECONDS });
    }

    if (url.pathname === "/refresh_access_token") {
      return json({ access_token: RENEWED_TOKEN, token_type: "bearer", expires_in: TOKEN_SECONDS });
    }

    if (url.pathname === "/v26.0/me") return json({ user_id: ACCOUNT_ID, username: USERNAME });

    if (url.pathname === `/v26.0/${ACCOUNT_ID}/media`) return json({ data: posts });

    const post = posts.find(({ id }) => url.pathname === `/v26.0/${id}`);

    if (post !== undefined) return json(post);

    if (url.hostname.endsWith(".cdninstagram.com")) return { status: 200, body: jpeg };

    return json({ error: { message: "Unsupported request" } }, 400);
  };

/**
 * The Instagram service against a fake Instagram that records every request. Only the HTTP
 * boundary is fake: token handling, caching, decoding, and configuration are the production code.
 */
const instagramWith = (answer: (request: SeenRequest) => Answer | Effect.Effect<Answer>) => {
  const requests: Array<SeenRequest> = [];

  const client = HttpClient.make((request, url, _signal, fiber) =>
    Effect.gen(function* () {
      const body =
        request.body._tag === "Uint8Array" ? new TextDecoder().decode(request.body.body) : "";

      const seen = {
        method: request.method,
        url,
        body,
        traced: !fiber.getRef(HttpClient.TracerDisabledWhen)(request),
      };

      requests.push(seen);

      const answered = answer(seen);
      const { status, body: responseBody } = Effect.isEffect(answered) ? yield* answered : answered;

      return HttpClientResponse.fromWeb(request, new Response(responseBody, { status }));
    }),
  );

  const live = InstagramApiLive.pipe(
    Layer.provide(Layer.succeed(HttpClient.HttpClient, client)),
    Layer.provide(
      ConfigProvider.layer(
        ConfigProvider.fromUnknown({
          BETTER_AUTH_URL: BASE_URL,
          INSTAGRAM_APP_ID: APP_ID,
          INSTAGRAM_APP_SECRET: APP_SECRET,
        }),
      ),
    ),
  );

  return { live, requests };
};

/** Creates a user through Better Auth and returns the headers of a signed-in browser. */
const signedInAs = Effect.fn("test.signedInAs")(function* (role: "user" | "admin") {
  const auth = yield* Auth;

  const email = `${role}-${crypto.randomUUID()}@example.test`;

  const { user } = yield* Effect.promise(() =>
    auth.instance.api.createUser({ body: { email, password: PASSWORD, name: role, role } }),
  );

  const response = yield* Effect.promise(() =>
    auth.instance.api.signInEmail({ body: { email, password: PASSWORD }, asResponse: true }),
  );

  const cookie = response.headers
    .getSetCookie()
    .map((header) => header.split(";")[0])
    .join("; ");

  return { userId: user.id, cookie };
});

/** A browser request to a connect route, with the cookies the browser holds. */
const routeRequest = (path: string, cookies: ReadonlyArray<string>) =>
  new Request(new URL(path, BASE_URL), { headers: { cookie: cookies.join("; ") } });

/** Runs a route program for `request`, as `runServerRoute` does. */
const runRoute = <E, R>(request: Request, program: Effect.Effect<Response, E, R>) =>
  program.pipe(Effect.provideService(RequestHeaders, request.headers));

/** A connection saved as Instagram Login leaves it, with a token of the given age. */
const saveConnection = Effect.fn("test.saveConnection")(function* (
  userId: string,
  token: { readonly expiresAt: Date; readonly refreshedAt: Date },
) {
  const db = yield* Database;

  yield* saveInstagramConnection({
    instagramUserId: ACCOUNT_ID,
    username: USERNAME,
    accessToken: LONG_TOKEN,
    tokenExpiresAt: token.expiresAt,
    connectedBy: userId,
  });

  // `saveInstagramConnection` stamps the renewal time now; the test sets the token's real age.
  yield* db.update(instagramConnection).set({ tokenRefreshedAt: token.refreshedAt });
});

/**
 * Instagram Login, token renewal, the News feed, and imports to the gallery: the server routes
 * and programs on a private PostgreSQL cluster, Better Auth, and a fake Instagram.
 */
layer(TestAppLive, { excludeTestServices: true, timeout: "120 seconds" })("instagram", (it) => {
  it.effect("connects the account an admin logs in with, through the state cookie", () =>
    Effect.gen(function* () {
      yield* deleteInstagramConnection();

      const admin = yield* signedInAs("admin");
      const instagram = instagramWith(workingInstagram());

      const start = yield* runRoute(
        routeRequest("/api/instagram/connect", [admin.cookie]),
        startInstagramConnection,
      ).pipe(Effect.provide(instagram.live));

      const authorizeUrl = new URL(start.headers.get("location") ?? "");
      const stateCookie = start.headers.get("set-cookie") ?? "";
      const state = authorizeUrl.searchParams.get("state") ?? "";

      expect(authorizeUrl.origin + authorizeUrl.pathname).toBe(
        "https://www.instagram.com/oauth/authorize",
      );
      expect(Object.fromEntries(authorizeUrl.searchParams)).toMatchObject({
        client_id: APP_ID,
        redirect_uri: `${BASE_URL}/api/instagram/callback`,
        response_type: "code",
        scope: "instagram_business_basic",
      });
      expect(state.length).toBeGreaterThanOrEqual(32);
      expect(stateCookie).toContain(`instagram_oauth_state=${state}`);
      expect(stateCookie).toMatch(/HttpOnly/);
      expect(stateCookie).toMatch(/SameSite=Lax/);

      const callback = routeRequest(`/api/instagram/callback?code=one-time-code&state=${state}`, [
        admin.cookie,
        stateCookie.split(";")[0] ?? "",
      ]);

      const finish = yield* runRoute(callback, finishInstagramConnection(callback)).pipe(
        Effect.provide(instagram.live),
      );

      expect(finish.headers.get("location")).toBe("/admin/instagram");
      expect(finish.headers.get("set-cookie")).toMatch(/instagram_oauth_state=;.*Max-Age=0/);

      const saved = yield* getInstagramConnection();

      expect(saved).toMatchObject({
        instagramUserId: ACCOUNT_ID,
        username: USERNAME,
        accessToken: LONG_TOKEN,
      });
      expect(saved?.tokenExpiresAt.getTime()).toBeGreaterThan(addDays(new Date(), 59).getTime());

      const [exchange] = instagram.requests;

      // The code is exchanged with the app secret in the body, for the redirect URI Instagram
      // checked; the long-lived token request is the only one with the secret in the address.
      expect(exchange?.method).toBe("POST");
      expect(Object.fromEntries(new URLSearchParams(exchange?.body))).toEqual({
        client_id: APP_ID,
        client_secret: APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: `${BASE_URL}/api/instagram/callback`,
        code: "one-time-code",
      });

      // Tokens and the app secret travel in addresses, and traces record addresses.
      expect(instagram.requests.map(({ traced }) => traced)).not.toContain(true);
    }),
  );

  // Without the state check, another site could make an admin's browser connect its account.
  it.effect.each([
    { name: "a different state", cookieState: "expected-state", queryState: "forged-state" },
    { name: "no state cookie", cookieState: null, queryState: "forged-state" },
    { name: "no state in the answer", cookieState: "expected-state", queryState: null },
  ])("connects nothing when the callback has $name", ({ cookieState, queryState }) =>
    Effect.gen(function* () {
      yield* deleteInstagramConnection();

      const admin = yield* signedInAs("admin");
      const instagram = instagramWith(workingInstagram());

      const cookies =
        cookieState === null
          ? [admin.cookie]
          : [admin.cookie, `instagram_oauth_state=${cookieState}`];
      const query = queryState === null ? "code=c" : `code=c&state=${queryState}`;
      const callback = routeRequest(`/api/instagram/callback?${query}`, cookies);

      const finish = yield* runRoute(callback, finishInstagramConnection(callback)).pipe(
        Effect.provide(instagram.live),
      );

      expect(finish.headers.get("location")).toBe("/admin/instagram?connect=failed");
      expect(yield* getInstagramConnection()).toBeNull();
      expect(instagram.requests).toEqual([]);
    }),
  );

  it.effect("lets only a signed-in admin start or finish Instagram Login", () =>
    Effect.gen(function* () {
      yield* deleteInstagramConnection();

      const member = yield* signedInAs("user");
      const instagram = instagramWith(workingInstagram());

      const run = (path: string, cookies: ReadonlyArray<string>) => {
        const request = routeRequest(path, cookies);

        return runRoute(
          request,
          path.startsWith("/api/instagram/connect")
            ? startInstagramConnection
            : finishInstagramConnection(request),
        ).pipe(Effect.provide(instagram.live));
      };

      const state = "a-valid-state-value";
      const callbackPath = `/api/instagram/callback?code=c&state=${state}`;
      const stateCookie = `instagram_oauth_state=${state}`;

      const signedOutStart = yield* run("/api/instagram/connect", []);
      const signedOutFinish = yield* run(callbackPath, [stateCookie]);
      const memberStart = yield* run("/api/instagram/connect", [member.cookie]);
      const memberFinish = yield* run(callbackPath, [member.cookie, stateCookie]);

      expect(signedOutStart.headers.get("location")).toBe("/admin/sign-in");
      expect(signedOutFinish.headers.get("location")).toBe("/admin/sign-in");
      expect(memberStart.status).toBe(403);
      expect(memberFinish.status).toBe(403);
      expect(yield* getInstagramConnection()).toBeNull();
      expect(instagram.requests).toEqual([]);
    }),
  );

  it.effect.each([
    {
      name: "renews a token with fewer than 30 days left",
      expiresInDays: 20,
      refreshedDaysAgo: 40,
      renewals: 1,
      token: RENEWED_TOKEN,
      status: "ready",
    },
    {
      // Instagram refuses to renew a token less than a day old.
      name: "keeps a token renewed less than a day ago",
      expiresInDays: 20,
      refreshedDaysAgo: 0,
      renewals: 0,
      token: LONG_TOKEN,
      status: "ready",
    },
    {
      name: "keeps a token with more than 30 days left",
      expiresInDays: 45,
      refreshedDaysAgo: 15,
      renewals: 0,
      token: LONG_TOKEN,
      status: "ready",
    },
    {
      // Instagram does not renew an expired token; only a new login works.
      name: "shows no posts once the token expired",
      expiresInDays: -1,
      refreshedDaysAgo: 61,
      renewals: 0,
      token: LONG_TOKEN,
      status: "not_connected",
    },
  ])("$name", ({ expiresInDays, refreshedDaysAgo, renewals, token, status }) =>
    Effect.gen(function* () {
      const admin = yield* signedInAs("admin");
      const mediaId = newMediaId();
      const instagram = instagramWith(workingInstagram([media(mediaId, "IMAGE")]));

      yield* saveConnection(admin.userId, {
        expiresAt: addDays(new Date(), expiresInDays),
        refreshedAt: subHours(subDays(new Date(), refreshedDaysAgo), 1),
      });

      const feed = yield* getNewsFeed.pipe(Effect.provide(instagram.live));

      const renewalRequests = instagram.requests.filter(
        ({ url }) => url.pathname === "/refresh_access_token",
      );
      const postRequests = instagram.requests.filter(({ url }) => url.pathname.endsWith("/media"));

      expect(feed.status).toBe(status);
      expect(renewalRequests).toHaveLength(renewals);
      expect((yield* getInstagramConnection())?.accessToken).toBe(token);
      // The posts are read with the token that is valid now.
      expect(postRequests.map(({ url }) => url.searchParams.get("access_token"))).toEqual(
        status === "ready" ? [token] : [],
      );
    }),
  );

  it.effect("adds a post's photo to the gallery once, and never shows the token", () =>
    Effect.gen(function* () {
      const admin = yield* signedInAs("admin");
      const mediaId = newMediaId();
      const instagram = instagramWith(workingInstagram([media(mediaId, "IMAGE")]));

      yield* saveConnection(admin.userId, {
        expiresAt: addDays(new Date(), 50),
        refreshedAt: new Date(),
      });

      const { id } = yield* importInstagramPost(admin.userId, mediaId).pipe(
        Effect.provide(instagram.live),
      );

      const again = yield* importInstagramPost(admin.userId, mediaId).pipe(
        Effect.provide(instagram.live),
        Effect.flip,
      );

      const photos = yield* listAllGalleryPhotos();
      const view = yield* getInstagramAdminView.pipe(Effect.provide(instagram.live));

      expect(photos.at(0)).toMatchObject({ id, width: 1080, height: 1350 });
      expect(again._tag).toBe("ConflictError");
      expect(photos.filter((photo) => photo.id === id)).toHaveLength(1);
      expect(view.posts.find((post) => post.id === mediaId)?.imported).toBe(true);
      expect(JSON.stringify(view)).not.toContain(LONG_TOKEN);
    }),
  );

  // Both requests pass the "already imported" check before either writes; the unique media ID
  // must still keep the gallery at one photo for the post.
  it.effect("adds one photo when two imports of the same post run at once", () =>
    Effect.gen(function* () {
      const admin = yield* signedInAs("admin");
      const mediaId = newMediaId();

      const bothDownloading = yield* Deferred.make<void>();
      let downloads = 0;

      const working = workingInstagram([media(mediaId, "IMAGE")]);
      const instagram = instagramWith((request) => {
        if (!request.url.hostname.endsWith(".cdninstagram.com")) return working(request);

        downloads += 1;

        if (downloads === 2) Deferred.doneUnsafe(bothDownloading, Effect.void);

        return Deferred.await(bothDownloading).pipe(Effect.as({ status: 200, body: jpeg }));
      });

      yield* saveConnection(admin.userId, {
        expiresAt: addDays(new Date(), 50),
        refreshedAt: new Date(),
      });

      const photosBefore = (yield* listAllGalleryPhotos()).length;

      const imports = yield* Effect.all(
        [
          importInstagramPost(admin.userId, mediaId).pipe(Effect.result),
          importInstagramPost(admin.userId, mediaId).pipe(Effect.result),
        ],
        { concurrency: 2 },
      ).pipe(Effect.provide(instagram.live));

      const failures = imports.filter((result) => result._tag === "Failure");

      expect(downloads).toBe(2);
      expect(failures.map((result) => result._tag === "Failure" && result.failure._tag)).toEqual([
        "ConflictError",
      ]);
      expect((yield* listAllGalleryPhotos()).length).toBe(photosBefore + 1);
    }),
  );

  it.effect.each([
    {
      name: "a video",
      post: (id: string) => media(id, "VIDEO", { thumbnail_url: IMAGE_URL }),
      error: "InvalidInputError",
    },
    {
      // The server fetches only Instagram's CDN, whatever address the answer gives.
      name: "an image outside Instagram's CDN",
      post: (id: string) => media(id, "IMAGE", { media_url: "https://internal.example/admin" }),
      error: "ServiceUnavailableError",
    },
  ])("adds nothing for $name", ({ post, error }) =>
    Effect.gen(function* () {
      const admin = yield* signedInAs("admin");
      const mediaId = newMediaId();
      const instagram = instagramWith(workingInstagram([post(mediaId)]));

      yield* saveConnection(admin.userId, {
        expiresAt: addDays(new Date(), 50),
        refreshedAt: new Date(),
      });

      const photosBefore = (yield* listAllGalleryPhotos()).length;

      const failure = yield* importInstagramPost(admin.userId, mediaId).pipe(
        Effect.provide(instagram.live),
        Effect.flip,
      );

      const downloads = instagram.requests.filter(
        ({ url }) => url.hostname !== "graph.instagram.com",
      );

      expect(failure._tag).toBe(error);
      expect(downloads).toEqual([]);
      expect((yield* listAllGalleryPhotos()).length).toBe(photosBefore);
    }),
  );
});

type Answer = {
  readonly status: number;
  readonly body: string | Uint8Array<ArrayBuffer>;
};

type SeenRequest = {
  readonly method: string;
  readonly url: URL;
  readonly body: string;
  readonly traced: boolean;
};

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
import { addDays, addYears, subHours } from "date-fns";
import { ConfigProvider, Deferred, Effect, Layer } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, expect } from "vite-plus/test";

import { PhotoStorageLive } from "../../src/server/gallery/photo-storage.server";
import { InstagramApiLive } from "../../src/server/instagram/instagram-api.server";
import { createConnectLinkToken } from "../../src/server/instagram/instagram-connect-link.server";
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

const CONFIG_ID = "9876543210";

/** The system-user token Unified login gives; it never expires. */
const ACCESS_TOKEN = "system-user-token";

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

/**
 * Meta as it answers when everything works, for the posts in `posts`. `assigned` is the account
 * list, which needs `business_management`; `granted` are the accounts the token's details name.
 */
const workingInstagram =
  (
    posts: ReadonlyArray<ReturnType<typeof media>> = [],
    access: {
      readonly assigned: ReadonlyArray<{ readonly id: string; readonly username: string }>;
      readonly granted: ReadonlyArray<string>;
    } = { assigned: [{ id: ACCOUNT_ID, username: USERNAME }], granted: [ACCOUNT_ID] },
  ) =>
  (request: SeenRequest): Answer | Effect.Effect<Answer> => {
    const { url } = request;

    if (url.pathname === "/v26.0/oauth/access_token") {
      return json({ access_token: ACCESS_TOKEN, token_type: "bearer" });
    }

    // A system-user token from a configuration with "Never" has no expiry.
    if (url.pathname === "/v26.0/debug_token") {
      return json({
        data: {
          is_valid: true,
          expires_at: 0,
          type: "SYSTEM_USER",
          granular_scopes: [{ scope: "instagram_basic", target_ids: access.granted }],
        },
      });
    }

    if (url.pathname === "/v26.0/me/assigned_instagram_accounts") {
      return json({ data: access.assigned });
    }

    if (
      url.pathname === `/v26.0/${ACCOUNT_ID}` &&
      url.searchParams.get("fields") === "id,username"
    ) {
      return json({ id: ACCOUNT_ID, username: USERNAME });
    }

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
          INSTAGRAM_CONFIG_ID: CONFIG_ID,
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

/** The site's secret, which signs connect links, as the server reads it. */
const SecretConfigLive = ConfigProvider.layer(
  ConfigProvider.fromUnknown({ BETTER_AUTH_SECRET: "integration-test-secret-with-32-characters" }),
);

/** A connect link's token for `username`, made by `adminId`. */
const linkTokenFor = (adminId: string, username: string) =>
  createConnectLinkToken(adminId, username).pipe(
    Effect.map(({ token }) => token),
    Effect.provide(SecretConfigLive),
  );

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
    accessToken: ACCESS_TOKEN,
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

      const startRequest = routeRequest("/api/instagram/connect", [admin.cookie]);

      const start = yield* runRoute(startRequest, startInstagramConnection(startRequest)).pipe(
        Effect.provide(instagram.live),
      );

      const authorizeUrl = new URL(start.headers.get("location") ?? "");
      const stateCookie = start.headers.get("set-cookie") ?? "";
      const state = authorizeUrl.searchParams.get("state") ?? "";

      // Unified login: Meta's dialog with the configuration, which sets the permissions.
      expect(authorizeUrl.origin + authorizeUrl.pathname).toBe(
        "https://www.facebook.com/v26.0/dialog/oauth",
      );
      expect(Object.fromEntries(authorizeUrl.searchParams)).toMatchObject({
        client_id: APP_ID,
        config_id: CONFIG_ID,
        redirect_uri: `${BASE_URL}/api/instagram/callback`,
        response_type: "code",
        override_default_response_type: "true",
      });
      expect(authorizeUrl.searchParams.has("scope")).toBe(false);
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
        accessToken: ACCESS_TOKEN,
      });
      // The token never expires, so the site never has to renew it.
      expect(saved?.tokenExpiresAt.getTime()).toBeGreaterThan(addYears(new Date(), 50).getTime());

      const [exchange] = instagram.requests;

      // The code is exchanged for the redirect URI the login used, as Meta requires.
      expect(exchange?.url.origin + (exchange?.url.pathname ?? "")).toBe(
        "https://graph.facebook.com/v26.0/oauth/access_token",
      );
      expect(Object.fromEntries(exchange?.url.searchParams ?? [])).toEqual({
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: `${BASE_URL}/api/instagram/callback`,
        code: "one-time-code",
      });

      // Tokens and the app secret travel in addresses, and traces record addresses.
      expect(instagram.requests.map(({ traced }) => traced)).not.toContain(true);
    }),
  );

  // The link lets Daniel connect without an admin account. It must connect only his account, so a
  // leaked or altered link cannot put someone else's posts on the News page.
  it.effect(
    "connects through a connect link without a sign-in, but only the account it names",
    () =>
      Effect.gen(function* () {
        yield* deleteInstagramConnection();

        const admin = yield* signedInAs("admin");

        /** Starts and finishes Instagram Login from a browser with no session, as Daniel's phone. */
        const loginWithLink = (token: string) =>
          Effect.gen(function* () {
            const instagram = instagramWith(workingInstagram());
            const startRequest = routeRequest(`/api/instagram/connect?link=${token}`, []);

            const start = yield* runRoute(
              startRequest,
              startInstagramConnection(startRequest),
            ).pipe(Effect.provide(instagram.live));

            const state = new URL(start.headers.get("location") ?? "").searchParams.get("state");
            const cookie = (start.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
            const callback = routeRequest(
              `/api/instagram/callback?code=one-time-code&state=${state ?? ""}`,
              [cookie],
            );

            const finish = yield* runRoute(callback, finishInstagramConnection(callback)).pipe(
              Effect.provide(instagram.live),
            );

            return { start, finish, requests: instagram.requests };
          }).pipe(Effect.provide(SecretConfigLive));

        // A link for another account: Instagram answers with Daniel's, so nothing is saved.
        const otherToken = yield* linkTokenFor(admin.userId, "@Someone.Else");
        const other = yield* loginWithLink(otherToken);

        expect(other.finish.headers.get("location")).toBe(
          `/admin/connect-instagram/${otherToken}?result=wrong_account`,
        );
        expect(yield* getInstagramConnection()).toBeNull();

        // A link whose account was edited: the signature no longer matches, so Instagram is never asked.
        const danielToken = yield* linkTokenFor(admin.userId, USERNAME);
        const [, signature] = danielToken.split(".");
        const editedBody = Buffer.from(
          JSON.stringify({
            by: admin.userId,
            username: "someone.else",
            expiresAt: "2099-01-01T00:00:00.000Z",
          }),
        ).toString("base64url");
        const edited = yield* Effect.gen(function* () {
          const instagram = instagramWith(workingInstagram());
          const request = routeRequest(
            `/api/instagram/connect?link=${editedBody}.${signature ?? ""}`,
            [],
          );

          const response = yield* runRoute(request, startInstagramConnection(request)).pipe(
            Effect.provide(instagram.live),
          );

          return { response, requests: instagram.requests };
        }).pipe(Effect.provide(SecretConfigLive));

        expect(edited.response.headers.get("location")).toContain("result=failed");
        expect(edited.requests).toEqual([]);

        // Daniel's own link connects his account, recorded as connected by the admin who made it.
        const daniel = yield* loginWithLink(danielToken);

        expect(daniel.finish.headers.get("location")).toBe(
          `/admin/connect-instagram/${danielToken}?result=connected`,
        );
        const db = yield* Database;
        const saved = yield* db
          .select({
            username: instagramConnection.username,
            connectedBy: instagramConnection.connectedBy,
          })
          .from(instagramConnection);

        expect(saved).toEqual([{ username: USERNAME, connectedBy: admin.userId }]);
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
            ? startInstagramConnection(request)
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

  // Meta's dashboard may not offer business_management, so the account list comes back empty;
  // the token's details still name the account, and the site must connect it from those.
  it.effect.each([
    {
      name: "connects the account the token's details name when the account list is empty",
      access: { assigned: [], granted: [ACCOUNT_ID] },
      location: "/admin/instagram",
      connected: true,
    },
    {
      name: "connects nothing when the login gives access to no Instagram account",
      access: { assigned: [], granted: [] },
      location: "/admin/instagram?connect=failed",
      connected: false,
    },
  ])("$name", ({ access, location, connected }) =>
    Effect.gen(function* () {
      yield* deleteInstagramConnection();

      const admin = yield* signedInAs("admin");
      const instagram = instagramWith(workingInstagram([], access));

      const startRequest = routeRequest("/api/instagram/connect", [admin.cookie]);
      const start = yield* runRoute(startRequest, startInstagramConnection(startRequest)).pipe(
        Effect.provide(instagram.live),
      );

      const state = new URL(start.headers.get("location") ?? "").searchParams.get("state") ?? "";
      const cookie = (start.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
      const callback = routeRequest(`/api/instagram/callback?code=c&state=${state}`, [
        admin.cookie,
        cookie,
      ]);

      const finish = yield* runRoute(callback, finishInstagramConnection(callback)).pipe(
        Effect.provide(instagram.live),
      );

      expect(finish.headers.get("location")).toBe(location);
      expect((yield* getInstagramConnection())?.username ?? null).toBe(connected ? USERNAME : null);
    }),
  );

  it.effect.each([
    {
      name: "reads the posts with a token that has not expired",
      expiresInDays: 3650,
      status: "ready",
    },
    { name: "shows no posts once the token expired", expiresInDays: -1, status: "not_connected" },
  ])("$name", ({ expiresInDays, status }) =>
    Effect.gen(function* () {
      const admin = yield* signedInAs("admin");
      const mediaId = newMediaId();
      const instagram = instagramWith(workingInstagram([media(mediaId, "IMAGE")]));

      yield* saveConnection(admin.userId, {
        expiresAt: addDays(new Date(), expiresInDays),
        refreshedAt: subHours(new Date(), 1),
      });

      const feed = yield* getNewsFeed.pipe(Effect.provide(instagram.live));

      const postRequests = instagram.requests.filter(({ url }) => url.pathname.endsWith("/media"));

      expect(feed.status).toBe(status);
      // Posts come from Meta's Graph API with the stored token, and only while it is valid.
      expect(postRequests.map(({ url }) => url.origin)).toEqual(
        status === "ready" ? ["https://graph.facebook.com"] : [],
      );
      expect(postRequests.map(({ url }) => url.searchParams.get("access_token"))).toEqual(
        status === "ready" ? [ACCESS_TOKEN] : [],
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

      expect(photos.at(0)).toMatchObject({ id, section: "work", width: 1080, height: 1350 });
      expect(again._tag).toBe("ConflictError");
      expect(photos.filter((photo) => photo.id === id)).toHaveLength(1);
      expect(view.posts.find((post) => post.id === mediaId)?.imported).toBe(true);
      expect(JSON.stringify(view)).not.toContain(ACCESS_TOKEN);
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
        ({ url }) => url.hostname !== "graph.facebook.com",
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

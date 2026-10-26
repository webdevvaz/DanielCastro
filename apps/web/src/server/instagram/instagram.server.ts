import "@tanstack/react-start/server-only";
import {
  deleteInstagramConnection,
  getInstagramConnection,
  listImportedInstagramMediaIds,
  saveInstagramConnection,
  updateInstagramToken,
} from "@daniel/db";
import { ConflictError, InvalidInputError, ServiceUnavailableError } from "@daniel/shared/errors";
import { addDays, differenceInHours, isAfter } from "date-fns";
import { Effect } from "effect";

import { addPhotoToGallery } from "../gallery/gallery.server";
import { checkPhotoBytes } from "../gallery/photo-image.server";
import { withAuditEvent } from "../observability/audit.server";
import { InstagramApi, type InstagramError, type InstagramPost } from "./instagram-api.server";

/** A token lasts about 60 days; it is renewed once fewer than this many remain. */
const RENEW_WITHIN_DAYS = 30;

/** Instagram renews only tokens that are at least a day old. */
const MIN_TOKEN_AGE_HOURS = 24;

const ALREADY_IMPORTED = "This Instagram post is already in the gallery";

const renewalDue = (connection: StoredConnection, now: Date) =>
  isAfter(addDays(now, RENEW_WITHIN_DAYS), connection.tokenExpiresAt) &&
  differenceInHours(now, connection.tokenRefreshedAt) >= MIN_TOKEN_AGE_HOURS;

/** Logs why Instagram failed and reports only that it is unavailable. */
const fromInstagram = <A, R>(effect: Effect.Effect<A, InstagramError, R>) =>
  effect.pipe(
    Effect.tapError((error) => Effect.logWarning("An Instagram request failed", error)),
    Effect.mapError(() => new ServiceUnavailableError({ service: "Instagram" })),
  );

/**
 * The connected account with a usable token; null when no account is connected or its token
 * expired. A token is renewed while the site is in use, so it does not expire. A failed renewal
 * is logged, and the current token is used until the next try.
 */
const activeConnection = Effect.gen(function* () {
  const connection = yield* getInstagramConnection();
  const now = new Date();

  if (connection === null || !isAfter(connection.tokenExpiresAt, now)) return null;

  if (!renewalDue(connection, now)) return connection;

  const api = yield* InstagramApi;

  return yield* api.refresh(connection.accessToken).pipe(
    Effect.tap((token) => updateInstagramToken(token.accessToken, token.tokenExpiresAt)),
    Effect.map((token): StoredConnection => ({
      ...connection,
      accessToken: token.accessToken,
      tokenExpiresAt: token.tokenExpiresAt,
    })),
    Effect.catchTag("InstagramError", (error) =>
      Effect.logWarning("Could not renew the Instagram token", error).pipe(Effect.as(connection)),
    ),
  );
}).pipe(Effect.withSpan("instagram.activeConnection"));

/** The recent posts of the connected account, or why there are none. */
const recentPosts = Effect.gen(function* () {
  const connection = yield* activeConnection;

  if (connection === null) return { status: "not_connected" } as const;

  const api = yield* InstagramApi;

  return yield* api.recentPosts(connection.instagramUserId, connection.accessToken).pipe(
    Effect.map((posts) => ({ status: "ready", posts }) as const),
    Effect.catchTag("InstagramError", (error) =>
      Effect.logWarning("Could not read the Instagram posts", error).pipe(
        Effect.as({ status: "unavailable" } as const),
      ),
    ),
  );
});

/**
 * Daniel's latest Instagram posts for the News page. Instagram being down, or no account being
 * connected, is a status and not a failure, so the page can link to Instagram instead.
 */
export const getNewsFeed = Effect.gen(function* () {
  const found = yield* recentPosts;

  if (found.status !== "ready") return { status: found.status, posts: [] } satisfies NewsFeed;

  const posts = found.posts.flatMap((post): Array<NewsPost> =>
    post.imageUrl === null
      ? []
      : [
          {
            id: post.id,
            caption: post.caption,
            kind: post.kind,
            imageUrl: post.imageUrl,
            permalink: post.permalink,
            postedAt: post.postedAt,
          },
        ],
  );

  return { status: "ready", posts } satisfies NewsFeed;
}).pipe(Effect.withSpan("getNewsFeed"));

/**
 * The Instagram admin page: whether the Meta app is set up, the connected account, and its
 * recent posts marked when already in the gallery. Never includes the access token.
 */
export const getInstagramAdminView = Effect.gen(function* () {
  const api = yield* InstagramApi;

  const stored = yield* getInstagramConnection();
  const found = yield* recentPosts;
  const imported = yield* listImportedInstagramMediaIds();

  const connection =
    stored === null
      ? null
      : {
          username: stored.username,
          connectedAt: stored.connectedAt,
          tokenExpiresAt: stored.tokenExpiresAt,
          expired: !isAfter(stored.tokenExpiresAt, new Date()),
        };

  const posts =
    found.status === "ready"
      ? found.posts.map((post): AdminInstagramPost => ({
          ...post,
          imported: imported.has(post.id),
        }))
      : [];

  return {
    configured: api.configured,
    connection,
    postsStatus: found.status,
    posts,
  } satisfies InstagramAdminView;
}).pipe(Effect.withSpan("getInstagramAdminView"));

/**
 * Connects the Instagram account an admin logged in with, from the code Instagram Login sent
 * back. Replaces any account connected before.
 */
export const connectInstagram = Effect.fn("connectInstagram")(
  function* (userId: string, code: string) {
    const api = yield* InstagramApi;

    const account = yield* api.connect(code);

    yield* saveInstagramConnection({
      instagramUserId: account.instagramUserId,
      username: account.username,
      accessToken: account.accessToken,
      tokenExpiresAt: account.tokenExpiresAt,
      connectedBy: userId,
    });

    yield* api.forgetPosts;
  },
  (effect, userId) =>
    effect.pipe(
      withAuditEvent({
        action: "instagram.connected",
        actorUserId: userId,
        targetType: "instagram_connection",
      }),
    ),
);

/** Forgets the connected account and its token. Photos already added to the gallery stay. */
export const disconnectInstagram = Effect.fn("disconnectInstagram")(
  function* (_userId: string) {
    const api = yield* InstagramApi;

    yield* deleteInstagramConnection();
    yield* api.forgetPosts;
  },
  (effect, userId) =>
    effect.pipe(
      withAuditEvent({
        action: "instagram.disconnected",
        actorUserId: userId,
        targetType: "instagram_connection",
      }),
    ),
);

/**
 * Adds the photo of an Instagram post at the start of the gallery; for an album, its first
 * photo. Fails with `ConflictError` when the post is already in the gallery or no account is
 * connected, and with `InvalidInputError` for a video.
 */
export const importInstagramPost = Effect.fn("importInstagramPost")(
  function* (userId: string, mediaId: string) {
    const imported = yield* listImportedInstagramMediaIds();

    if (imported.has(mediaId)) return yield* new ConflictError({ reason: ALREADY_IMPORTED });

    const connection = yield* activeConnection;

    if (connection === null) {
      return yield* new ConflictError({ reason: "Connect Instagram before you add posts" });
    }

    const api = yield* InstagramApi;

    const post = yield* fromInstagram(api.post(mediaId, connection.accessToken));

    if (post.kind === "video") {
      return yield* new InvalidInputError({ reason: "You can add only photos to the gallery" });
    }

    if (post.imageUrl === null) {
      return yield* new InvalidInputError({ reason: "This post has no photo to add" });
    }

    const bytes = yield* fromInstagram(api.download(post.imageUrl));
    const photo = yield* checkPhotoBytes(bytes);

    return yield* addPhotoToGallery(photo, { userId, instagramMediaId: mediaId });
  },
  (effect, userId, mediaId) =>
    effect.pipe(
      withAuditEvent({
        action: "gallery.photo_imported",
        actorUserId: userId,
        targetType: "instagram_post",
        targetId: mediaId,
      }),
    ),
);

type StoredConnection = NonNullable<Effect.Success<ReturnType<typeof getInstagramConnection>>>;

/** A post on the News page. Posts without an image are left out. */
export type NewsPost = Omit<InstagramPost, "imageUrl"> & { readonly imageUrl: string };

/** The News page's posts, or why there are none. */
export type NewsFeed = {
  readonly status: "ready" | "not_connected" | "unavailable";
  readonly posts: ReadonlyArray<NewsPost>;
};

/** A post on the Instagram admin page. */
export type AdminInstagramPost = InstagramPost & {
  /** Whether the post's photo is already in the gallery. */
  readonly imported: boolean;
};

/** What the Instagram admin page shows. */
export type InstagramAdminView = {
  readonly configured: boolean;
  readonly connection: {
    readonly username: string;
    readonly connectedAt: Date;
    readonly tokenExpiresAt: Date;
    /** The site was not used for about 60 days, so the token could not be renewed. */
    readonly expired: boolean;
  } | null;
  readonly postsStatus: "ready" | "not_connected" | "unavailable";
  readonly posts: ReadonlyArray<AdminInstagramPost>;
};

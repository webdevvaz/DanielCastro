import "@tanstack/react-start/server-only";
import { addYears, fromUnixTime } from "date-fns";
import {
  Array as Arr,
  Cache,
  Config,
  Context,
  Data,
  type Duration,
  Effect,
  Exit,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { describeHttpFailure } from "../describe-http-failure";

/** The Graph API version these requests were written for. */
const GRAPH_VERSION = "v26.0";

/**
 * Meta's login dialog for "Instagram API with Unified login" (Facebook Login for Business). The
 * configuration (`config_id`) sets the permissions and the token type, so there is no `scope`.
 */
const AUTHORIZE_URL = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

const GRAPH_URL = "https://graph.facebook.com";

/**
 * How long a token that Meta says never expires is treated as valid. The configuration's
 * system-user token has no expiry (`expires_at` 0); the database keeps a date.
 */
const NEVER_EXPIRES_YEARS = 100;

const REQUEST_TIMEOUT = "10 seconds";
const DOWNLOAD_TIMEOUT = "30 seconds";

/** Instagram's image addresses stop working after a while, so the posts are read again often. */
const POSTS_TIME_TO_LIVE = "15 minutes";

/** A failed read is retried soon, but not on every page view. */
const FAILURE_TIME_TO_LIVE = "1 minute";

const RECENT_POSTS = 24;

/** The largest image an import downloads; Instagram's images are far smaller. */
const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;

const MEDIA_FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

const POST_KINDS = { IMAGE: "image", VIDEO: "video", CAROUSEL_ALBUM: "carousel" } as const;

/** Instagram serves post images from its own CDN and Facebook's; the server fetches nothing else. */
const IMAGE_HOSTS = [".cdninstagram.com", ".fbcdn.net"];

const isInstagramImageUrl = (address: string) => {
  const url = URL.parse(address);

  return (
    url !== null &&
    url.protocol === "https:" &&
    IMAGE_HOSTS.some((host) => url.hostname.endsWith(host))
  );
};

const postsTimeToLive = (exit: Exit.Exit<unknown, unknown>): Duration.Input =>
  Exit.isSuccess(exit) ? POSTS_TIME_TO_LIVE : FAILURE_TIME_TO_LIVE;

const NumericId = Schema.Union([Schema.String, Schema.Finite]);

const TokenResponse = Schema.Struct({
  access_token: Schema.String,
});

/**
 * The token's details. `expires_at` is seconds since 1970, or 0 when it never expires.
 * `granular_scopes` names the assets each permission covers: for `instagram_basic`, the
 * Instagram account the login gave access to.
 */
const DebugTokenResponse = Schema.Struct({
  data: Schema.Struct({
    expires_at: Schema.optional(Schema.Finite),
    granular_scopes: Schema.optional(
      Schema.Array(
        Schema.Struct({
          scope: Schema.String,
          target_ids: Schema.optional(Schema.Array(NumericId)),
        }),
      ),
    ),
  }),
});

/** One Instagram account's ID and username. */
const AccountFields = Schema.Struct({
  id: NumericId,
  username: Schema.String,
});

/** The Instagram accounts the login gave this app access to; needs `business_management`. */
const AssignedAccountsResponse = Schema.Struct({
  data: Schema.Array(AccountFields),
});

const Media = Schema.Struct({
  id: Schema.String,
  caption: Schema.optional(Schema.String),
  media_type: Schema.Literals(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]),
  media_url: Schema.optional(Schema.String),
  thumbnail_url: Schema.optional(Schema.String),
  permalink: Schema.String,
  timestamp: Schema.String,
});

const AlbumChild = Schema.Struct({
  media_type: Schema.String,
  media_url: Schema.optional(Schema.String),
});

// Items are decoded one by one, so one post Instagram describes differently does not hide the rest.
const ItemList = Schema.Struct({
  data: Schema.Array(Schema.Unknown),
});

/** A Graph API request; Meta takes the access token as an address parameter. */
const graph = (path: string, params: Readonly<Record<string, string>>) =>
  HttpClientRequest.get(`${GRAPH_URL}/${GRAPH_VERSION}/${path}`, { urlParams: params });

const decodeMedia = Schema.decodeUnknownOption(Media);
const decodeAlbumChild = Schema.decodeUnknownOption(AlbumChild);

/** When a token stops working: its `expires_at`, or far in the future when it never expires. */
const expiryOf = (expiresAt: number | undefined) =>
  expiresAt === undefined || expiresAt === 0
    ? addYears(new Date(), NEVER_EXPIRES_YEARS)
    : fromUnixTime(expiresAt);

/** A post as the site uses it. A video shows its cover image; a video with licensed music may have none. */
const postOf = (media: typeof Media.Type): InstagramPost => ({
  id: media.id,
  caption: media.caption ?? null,
  kind: POST_KINDS[media.media_type],
  imageUrl: (media.media_type === "VIDEO" ? media.thumbnail_url : media.media_url) ?? null,
  permalink: media.permalink,
  postedAt: media.timestamp,
});

/** A post list request, compared by value so the cache recognizes a repeated request. */
class PostsQuery extends Data.Class<{
  readonly instagramUserId: string;
  readonly accessToken: string;
}> {}

const makeInstagramApi = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;

  const appId = yield* Config.option(Config.String("INSTAGRAM_APP_ID"));
  const appSecret = yield* Config.option(Config.Redacted("INSTAGRAM_APP_SECRET"));
  const configId = yield* Config.option(Config.String("INSTAGRAM_CONFIG_ID"));
  const siteUrl = yield* Config.String("BETTER_AUTH_URL");

  const app = Option.all({ appId, appSecret, configId });
  const redirectUri = new URL("/api/instagram/callback", siteUrl).toString();

  // Meta takes tokens and the app secret in the address, and the HTTP client traces
  // addresses, so tracing is off for every request here.
  const send = <S extends Schema.Constraint>(
    operation: string,
    request: HttpClientRequest.HttpClientRequest,
    schema: S,
  ): Effect.Effect<S["Type"], InstagramError, S["DecodingServices"]> =>
    client.execute(request).pipe(
      Effect.flatMap(HttpClientResponse.filterStatusOk),
      Effect.flatMap(HttpClientResponse.schemaBodyJson(schema)),
      Effect.timeout(REQUEST_TIMEOUT),
      Effect.mapError(
        (error) => new InstagramError({ operation, cause: describeHttpFailure(error) }),
      ),
      Effect.provideService(HttpClient.TracerDisabledWhen, () => true),
      Effect.withSpan(`instagram.${operation}`),
    );

  const requireApp = (operation: string) =>
    Effect.fromOption(app).pipe(
      Effect.mapError(
        () =>
          new InstagramError({
            operation,
            cause: "INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, or INSTAGRAM_CONFIG_ID is not set",
          }),
      ),
    );

  const posts = yield* Cache.makeWith(
    (query: PostsQuery) =>
      send(
        "recentPosts",
        graph(`${query.instagramUserId}/media`, {
          fields: MEDIA_FIELDS,
          limit: String(RECENT_POSTS),
          access_token: query.accessToken,
        }),
        ItemList,
      ).pipe(
        Effect.map((list) =>
          Arr.getSomes(list.data.map((item) => decodeMedia(item))).map((media) => postOf(media)),
        ),
      ),
    { capacity: 4, timeToLive: postsTimeToLive },
  );

  const connect = Effect.fn("instagram.connect")(function* (
    code: string,
    preferredUsername: string | null,
  ) {
    const credentials = yield* requireApp("connect");
    const secret = Redacted.value(credentials.appSecret);

    const token = yield* send(
      "exchangeCode",
      graph("oauth/access_token", {
        client_id: credentials.appId,
        client_secret: secret,
        redirect_uri: redirectUri,
        code,
      }),
      TokenResponse,
    );

    // The exchange does not say when the token expires; the token's details do.
    const details = yield* send(
      "debugToken",
      graph("debug_token", {
        input_token: token.access_token,
        access_token: `${credentials.appId}|${secret}`,
      }),
      DebugTokenResponse,
    );

    // Meta's dashboard does not always offer `business_management`, which this list needs. Without
    // it the list is empty or refused; the token's details then name the account instead.
    const assigned = yield* send(
      "assignedAccounts",
      graph("me/assigned_instagram_accounts", {
        fields: "id,username",
        access_token: token.access_token,
      }),
      AssignedAccountsResponse,
    ).pipe(
      Effect.map((list) => list.data),
      Effect.catchTag("InstagramError", (error) =>
        Effect.logInfo(
          "Listing assigned Instagram accounts failed; using the token's details",
          error,
        ).pipe(Effect.as([])),
      ),
    );

    const grantedIds = (details.data.granular_scopes ?? [])
      .filter((grant) => grant.scope === "instagram_basic")
      .flatMap((grant) => grant.target_ids ?? []);

    const accounts =
      assigned.length > 0
        ? assigned
        : yield* Effect.forEach(grantedIds, (id) =>
            send(
              "account",
              graph(String(id), { fields: "id,username", access_token: token.access_token }),
              AccountFields,
            ),
          );

    // A login may give access to several accounts; a connect link names the one it wants.
    const chosen =
      accounts.find((account) => account.username.toLowerCase() === preferredUsername) ??
      accounts.at(0);

    if (chosen === undefined) {
      return yield* new InstagramError({
        operation: "account",
        cause: "The login gave access to no Instagram account",
      });
    }

    const account: InstagramAccount = {
      instagramUserId: String(chosen.id),
      username: chosen.username,
      accessToken: token.access_token,
      tokenExpiresAt: expiryOf(details.data.expires_at),
    };

    return account;
  });

  const post = Effect.fn("instagram.post")(function* (mediaId: string, accessToken: string) {
    const media = yield* send(
      "post",
      graph(mediaId, { fields: MEDIA_FIELDS, access_token: accessToken }),
      Media,
    );

    const found = postOf(media);

    if (found.kind !== "carousel" || found.imageUrl !== null) return found;

    // An album without its own image: use the first photo in it.
    const children = yield* send(
      "postChildren",
      graph(`${mediaId}/children`, { fields: "media_type,media_url", access_token: accessToken }),
      ItemList,
    );

    const firstPhoto = Arr.getSomes(children.data.map((item) => decodeAlbumChild(item))).find(
      (child) => child.media_type === "IMAGE" && child.media_url !== undefined,
    );

    return { ...found, imageUrl: firstPhoto?.media_url ?? null };
  });

  const download = Effect.fn("instagram.download")(function* (url: string) {
    if (!isInstagramImageUrl(url)) {
      return yield* new InstagramError({
        operation: "download",
        cause: "The image is not on Instagram's CDN",
      });
    }

    const buffer = yield* client.execute(HttpClientRequest.get(url)).pipe(
      Effect.flatMap(HttpClientResponse.filterStatusOk),
      Effect.flatMap((response) => response.arrayBuffer),
      Effect.timeout(DOWNLOAD_TIMEOUT),
      Effect.mapError(
        (error) => new InstagramError({ operation: "download", cause: describeHttpFailure(error) }),
      ),
      Effect.provideService(HttpClient.TracerDisabledWhen, () => true),
    );

    if (buffer.byteLength > MAX_DOWNLOAD_BYTES) {
      return yield* new InstagramError({ operation: "download", cause: "The image is too large" });
    }

    return new Uint8Array(buffer);
  });

  return InstagramApi.of({
    configured: Option.isSome(app),
    authorizeUrl: (state) =>
      Option.match(app, {
        onNone: () => null,
        onSome: (credentials) => {
          const url = new URL(AUTHORIZE_URL);

          url.searchParams.set("client_id", credentials.appId);
          url.searchParams.set("config_id", credentials.configId);
          url.searchParams.set("redirect_uri", redirectUri);
          url.searchParams.set("response_type", "code");
          url.searchParams.set("override_default_response_type", "true");
          url.searchParams.set("state", state);

          return url.toString();
        },
      }),
    connect,
    recentPosts: (instagramUserId, accessToken) =>
      Cache.get(posts, new PostsQuery({ instagramUserId, accessToken })),
    forgetPosts: Cache.invalidateAll(posts),
    post,
    download,
  });
});

/** A failed or unusable answer from Instagram. `cause` never includes the request address. */
export class InstagramError extends Schema.TaggedError<InstagramError>()("InstagramError", {
  operation: Schema.String,
  cause: Schema.String,
}) {}

/**
 * Instagram login and Daniel's posts, through Meta's "Instagram API with Unified login": a
 * Facebook Login for Business configuration that gives a system-user token, which never expires.
 */
export class InstagramApi extends Context.Service<InstagramApi, InstagramApiService>()(
  "web/InstagramApi",
) {}

/**
 * Instagram over HTTP. Needs the Meta app's ID and secret (`INSTAGRAM_APP_ID`,
 * `INSTAGRAM_APP_SECRET`) and its login configuration (`INSTAGRAM_CONFIG_ID`); without them nobody
 * can connect an account. Meta sends the browser back to `BETTER_AUTH_URL` +
 * `/api/instagram/callback`, which must be a redirect URI of the configuration and of Facebook
 * Login for Business.
 */
export const InstagramApiLive = Layer.effect(InstagramApi, makeInstagramApi);

/** The connected account and its access token. */
export type InstagramAccount = {
  readonly instagramUserId: string;
  readonly username: string;
  readonly accessToken: string;
  readonly tokenExpiresAt: Date;
};

/** One Instagram post. */
export type InstagramPost = {
  readonly id: string;
  /** Null when the post has none, or when Instagram does not give it. */
  readonly caption: string | null;
  readonly kind: "image" | "video" | "carousel";
  /** The image to show; null for a video with licensed music. The address expires. */
  readonly imageUrl: string | null;
  readonly permalink: string;
  /** When the post was published, in ISO 8601 with Instagram's offset (`+0000`). */
  readonly postedAt: string;
};

/** What the rest of the site can ask Instagram. Every request fails with `InstagramError`. */
export type InstagramApiService = {
  /** Whether the Meta app's ID, secret, and login configuration are set. */
  readonly configured: boolean;
  /** Where "Connect Instagram" sends the browser; null when the app is not configured. */
  readonly authorizeUrl: (state: string) => string | null;
  /**
   * Exchanges the code from the login for a token and the Instagram account it reaches: the one
   * named `preferredUsername` (lowercase) when the login reaches several, else the first.
   */
  readonly connect: (
    code: string,
    preferredUsername: string | null,
  ) => Effect.Effect<InstagramAccount, InstagramError>;
  /** The most recent posts, newest first, read again every 15 minutes. */
  readonly recentPosts: (
    instagramUserId: string,
    accessToken: string,
  ) => Effect.Effect<ReadonlyArray<InstagramPost>, InstagramError>;
  /** Forgets the cached posts, after connecting or disconnecting an account. */
  readonly forgetPosts: Effect.Effect<void>;
  /** One post, with the first photo of an album as its image. */
  readonly post: (
    mediaId: string,
    accessToken: string,
  ) => Effect.Effect<InstagramPost, InstagramError>;
  /** Downloads a post's image for the gallery. */
  readonly download: (url: string) => Effect.Effect<Uint8Array<ArrayBuffer>, InstagramError>;
};

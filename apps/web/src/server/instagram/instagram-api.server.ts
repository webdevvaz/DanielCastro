import "@tanstack/react-start/server-only";
import { addSeconds } from "date-fns";
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
  Predicate,
  Redacted,
  Schema,
} from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { describeHttpFailure } from "../describe-http-failure";

const AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const GRAPH_URL = "https://graph.instagram.com";

/** The Graph API version these requests were written for. */
const GRAPH_VERSION = "v26.0";

/** Read access to the professional account's profile and posts. */
const SCOPE = "instagram_business_basic";

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

const TokenFields = Schema.Struct({
  access_token: Schema.String,
  user_id: NumericId,
});

// The documentation shows the short-lived token inside a `data` list; some answers are flat.
const ShortLivedTokenResponse = Schema.Union([
  TokenFields,
  Schema.Struct({ data: Schema.NonEmptyArray(TokenFields) }),
]);

const LongLivedTokenResponse = Schema.Struct({
  access_token: Schema.String,
  expires_in: Schema.Finite,
});

const ProfileFields = Schema.Struct({
  user_id: NumericId,
  username: Schema.String,
});

const ProfileResponse = Schema.Union([
  ProfileFields,
  Schema.Struct({ data: Schema.NonEmptyArray(ProfileFields) }),
]);

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

/** A Graph API request; Instagram takes the access token as an address parameter. */
const graph = (path: string, params: Readonly<Record<string, string>>) =>
  HttpClientRequest.get(`${GRAPH_URL}/${GRAPH_VERSION}/${path}`, { urlParams: params });

const decodeMedia = Schema.decodeUnknownOption(Media);
const decodeAlbumChild = Schema.decodeUnknownOption(AlbumChild);

const isDataList = <A>(answer: A | DataList<A>): answer is DataList<A> =>
  Predicate.hasProperty(answer, "data");

/** The single item of an answer that Instagram may or may not wrap in a `data` list. */
const unwrap = <A>(answer: A | DataList<A>): A =>
  isDataList(answer) ? Arr.headNonEmpty(answer.data) : answer;

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
  const siteUrl = yield* Config.String("BETTER_AUTH_URL");

  const app = Option.all({ appId, appSecret });
  const redirectUri = new URL("/api/instagram/callback", siteUrl).toString();

  // Instagram takes tokens and the app secret in the address, and the HTTP client traces
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
            cause: "INSTAGRAM_APP_ID or INSTAGRAM_APP_SECRET is not set",
          }),
      ),
    );

  const longLivedToken = (
    operation: string,
    url: string,
    params: Readonly<Record<string, string>>,
  ) =>
    send(operation, HttpClientRequest.get(url, { urlParams: params }), LongLivedTokenResponse).pipe(
      Effect.map((token): InstagramToken => ({
        accessToken: token.access_token,
        tokenExpiresAt: addSeconds(new Date(), token.expires_in),
      })),
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

  const connect = Effect.fn("instagram.connect")(function* (code: string) {
    const credentials = yield* requireApp("connect");
    const secret = Redacted.value(credentials.appSecret);

    const shortLived = yield* send(
      "exchangeCode",
      HttpClientRequest.post(TOKEN_URL).pipe(
        HttpClientRequest.bodyUrlParams({
          client_id: credentials.appId,
          client_secret: secret,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
      ),
      ShortLivedTokenResponse,
    ).pipe(Effect.map(unwrap));

    const token = yield* longLivedToken("exchangeToken", `${GRAPH_URL}/access_token`, {
      grant_type: "ig_exchange_token",
      client_secret: secret,
      access_token: shortLived.access_token,
    });

    const profile = yield* send(
      "profile",
      graph("me", { fields: "user_id,username", access_token: token.accessToken }),
      ProfileResponse,
    ).pipe(Effect.map(unwrap));

    const account: InstagramAccount = {
      instagramUserId: String(profile.user_id),
      username: profile.username,
      accessToken: token.accessToken,
      tokenExpiresAt: token.tokenExpiresAt,
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
      Option.match(appId, {
        onNone: () => null,
        onSome: (id) => {
          const url = new URL(AUTHORIZE_URL);

          url.searchParams.set("client_id", id);
          url.searchParams.set("redirect_uri", redirectUri);
          url.searchParams.set("response_type", "code");
          url.searchParams.set("scope", SCOPE);
          url.searchParams.set("state", state);
          // Asks for the account's password, so a browser logged in to another account cannot
          // connect the wrong one.
          url.searchParams.set("force_reauth", "true");

          return url.toString();
        },
      }),
    connect,
    refresh: (accessToken) =>
      longLivedToken("refreshToken", `${GRAPH_URL}/refresh_access_token`, {
        grant_type: "ig_refresh_token",
        access_token: accessToken,
      }),
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

/** Instagram Login and Daniel's posts, through the Instagram API with Instagram Login. */
export class InstagramApi extends Context.Service<InstagramApi, InstagramApiService>()(
  "web/InstagramApi",
) {}

/**
 * Instagram over HTTP. Needs `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET` from the Meta app;
 * without them the admin cannot connect an account. Instagram sends the browser back to
 * `BETTER_AUTH_URL` + `/api/instagram/callback`, which must be a valid redirect URI in the app.
 */
export const InstagramApiLive = Layer.effect(InstagramApi, makeInstagramApi);

type DataList<A> = { readonly data: readonly [A, ...Array<A>] };

/** A renewed long-lived access token. */
export type InstagramToken = {
  readonly accessToken: string;
  readonly tokenExpiresAt: Date;
};

/** The connected account and its first long-lived token. */
export type InstagramAccount = InstagramToken & {
  readonly instagramUserId: string;
  readonly username: string;
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
  /** Whether the Meta app's ID and secret are set. */
  readonly configured: boolean;
  /** Where "Connect Instagram" sends the admin; null when the app is not configured. */
  readonly authorizeUrl: (state: string) => string | null;
  /** Exchanges the code from Instagram Login for a long-lived token and the account. */
  readonly connect: (code: string) => Effect.Effect<InstagramAccount, InstagramError>;
  /** Renews a long-lived token that is at least a day old. */
  readonly refresh: (accessToken: string) => Effect.Effect<InstagramToken, InstagramError>;
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

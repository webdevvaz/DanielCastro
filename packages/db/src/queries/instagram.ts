import { eq, isNotNull } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "../database";
import { mapDatabaseError } from "../errors";
import { galleryPhoto } from "../schema/gallery";
import { INSTAGRAM_CONNECTION_ID, instagramConnection } from "../schema/instagram";

/**
 * The connected Instagram account with its access token, or null when none is connected. The
 * token is for server code only; never return it to a browser.
 */
export const getInstagramConnection = Effect.fn("db.getInstagramConnection")(function* () {
  const db = yield* Database;

  const connection = yield* db.query.instagramConnection.findFirst({
    columns: {
      instagramUserId: true,
      username: true,
      accessToken: true,
      tokenExpiresAt: true,
      tokenRefreshedAt: true,
      connectedAt: true,
    },
    where: { id: { eq: INSTAGRAM_CONNECTION_ID } },
  });

  return connection ?? null;
}, mapDatabaseError("getInstagramConnection"));

/** Connects an Instagram account, replacing any account connected before. */
export const saveInstagramConnection = Effect.fn("db.saveInstagramConnection")(function* (
  values: NewInstagramConnection,
) {
  const db = yield* Database;

  const row = { ...values, tokenRefreshedAt: new Date(), connectedAt: new Date() };

  yield* db
    .insert(instagramConnection)
    .values({ id: INSTAGRAM_CONNECTION_ID, ...row })
    .onConflictDoUpdate({ target: instagramConnection.id, set: row });
}, mapDatabaseError("saveInstagramConnection"));

/** Stores a renewed access token. Does nothing when the account was disconnected meanwhile. */
export const updateInstagramToken = Effect.fn("db.updateInstagramToken")(function* (
  accessToken: string,
  tokenExpiresAt: Date,
) {
  const db = yield* Database;

  yield* db
    .update(instagramConnection)
    .set({ accessToken, tokenExpiresAt, tokenRefreshedAt: new Date() })
    .where(eq(instagramConnection.id, INSTAGRAM_CONNECTION_ID));
}, mapDatabaseError("updateInstagramToken"));

/** Forgets the connected account and its token. */
export const deleteInstagramConnection = Effect.fn("db.deleteInstagramConnection")(function* () {
  const db = yield* Database;

  yield* db.delete(instagramConnection).where(eq(instagramConnection.id, INSTAGRAM_CONNECTION_ID));
}, mapDatabaseError("deleteInstagramConnection"));

/** The Instagram posts that already have a photo in the gallery. */
export const listImportedInstagramMediaIds = Effect.fn("db.listImportedInstagramMediaIds")(
  function* () {
    const db = yield* Database;

    const rows = yield* db
      .select({ mediaId: galleryPhoto.instagramMediaId })
      .from(galleryPhoto)
      .where(isNotNull(galleryPhoto.instagramMediaId));

    return new Set(rows.flatMap(({ mediaId }) => (mediaId === null ? [] : [mediaId])));
  },
  mapDatabaseError("listImportedInstagramMediaIds"),
);

/** The account and token to store when an admin connects Instagram. */
export type NewInstagramConnection = {
  readonly instagramUserId: string;
  readonly username: string;
  readonly accessToken: string;
  readonly tokenExpiresAt: Date;
  readonly connectedBy: string;
};

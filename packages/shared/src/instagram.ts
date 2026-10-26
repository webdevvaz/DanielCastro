import { Schema } from "effect";

/** An Instagram media ID: digits only, as the Instagram API returns them. */
export const InstagramMediaId = Schema.String.check(
  Schema.isPattern(/^\d{1,40}$/, { message: "Enter an Instagram media ID" }),
);

/** Adds one Instagram post's image to the gallery. */
export const ImportInstagramPostInput = Schema.Struct({
  mediaId: InstagramMediaId,
});

/** Decoded import request. */
export type ImportInstagramPostInput = typeof ImportInstagramPostInput.Type;

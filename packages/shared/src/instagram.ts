import { Schema } from "effect";

/** An Instagram media ID: digits only, as the Instagram API returns them. */
export const InstagramMediaId = Schema.String.check(
  Schema.isPattern(/^\d{1,40}$/, { message: "Enter an Instagram media ID" }),
);

/** Adds one Instagram post's image to the gallery. */
export const ImportInstagramPostInput = Schema.Struct({
  mediaId: InstagramMediaId,
});

/** An Instagram username, with or without the @. */
export const InstagramUsername = Schema.Trim.check(
  Schema.isPattern(/^@?[A-Za-z0-9._]{1,30}$/, { message: "Enter an Instagram @username" }),
);

/** Creates a link that connects this Instagram account without an admin sign-in. */
export const CreateInstagramConnectLinkInput = Schema.Struct({
  username: InstagramUsername,
});

/** The token at the end of a connect link. */
export const InstagramConnectLinkInput = Schema.Struct({
  token: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(1000)),
});

/** Decoded import request. */
export type ImportInstagramPostInput = typeof ImportInstagramPostInput.Type;

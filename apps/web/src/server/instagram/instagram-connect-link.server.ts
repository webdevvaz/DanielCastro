import "@tanstack/react-start/server-only";
import { addDays, isAfter, parseISO } from "date-fns";
import { Config, Effect, Option, Redacted, Schema } from "effect";
import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";

/** How long Daniel has to open the link. */
const LINK_DAYS = 7;

const KEY_BYTES = 32;

/** Separates this key from every other key derived from `BETTER_AUTH_SECRET`. */
const KEY_PURPOSE = "daniel/instagram-connect-link";

/** Who made the link, the only account it may connect, and when it stops working. */
const LinkPayload = Schema.Struct({
  by: Schema.String,
  username: Schema.String,
  expiresAt: Schema.String,
});

const decodePayload = Schema.decodeUnknownOption(Schema.fromJsonString(LinkPayload));

const linkKey = Effect.gen(function* () {
  const secret = yield* Config.Redacted("BETTER_AUTH_SECRET");

  return Buffer.from(
    hkdfSync("sha256", Redacted.value(secret), new Uint8Array(0), KEY_PURPOSE, KEY_BYTES),
  );
});

const sign = (key: Buffer, body: string) =>
  createHmac("sha256", key).update(body).digest("base64url");

/** Compares in constant time, so the response time tells nothing about the signature. */
const sameSignature = (expected: string, received: string) => {
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);

  return (
    expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes)
  );
};

/** An Instagram username as the site compares it: lowercase, without the @. */
export const normalizeInstagramUsername = (username: string) =>
  username.trim().replace(/^@/, "").toLowerCase();

/**
 * Makes the token of a connect link: who made it, the only account it may connect, and its
 * expiry, signed with a key derived from `BETTER_AUTH_SECRET`. Nothing is stored; changing the
 * secret makes every link invalid.
 */
export const createConnectLinkToken = Effect.fn("createConnectLinkToken")(function* (
  adminId: string,
  username: string,
) {
  const key = yield* linkKey;

  const expiresAt = addDays(new Date(), LINK_DAYS);

  const payload: ConnectLink = {
    by: adminId,
    username: normalizeInstagramUsername(username),
    expiresAt: expiresAt.toISOString(),
  };

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return { token: `${body}.${sign(key, body)}`, expiresAt };
});

/** The link a token stands for, or none when it is forged, damaged, or expired. */
export const readConnectLinkToken = Effect.fn("readConnectLinkToken")(function* (token: string) {
  const key = yield* linkKey;

  const [body, signature, ...rest] = token.split(".");

  if (body === undefined || signature === undefined || rest.length > 0) return Option.none();

  if (!sameSignature(sign(key, body), signature)) return Option.none();

  return decodePayload(Buffer.from(body, "base64url").toString("utf8")).pipe(
    Option.filter((link) => isAfter(parseISO(link.expiresAt), new Date())),
  );
});

/** A decoded connect link. */
export type ConnectLink = typeof LinkPayload.Type;

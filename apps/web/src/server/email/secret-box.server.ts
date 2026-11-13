import "@tanstack/react-start/server-only";
import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

const KEY_BYTES = 32;

const IV_BYTES = 12;

/** The format of a sealed value: `v1.<iv>.<tag>.<ciphertext>`, each part in base64url. */
const VERSION = "v1";

/** Names this use of the secret, so the derived key differs from any other derived from it. */
const KEY_PURPOSE = "daniel/settings-secrets";

const makeSecretBox = Effect.gen(function* () {
  const secret = yield* Config.Redacted("BETTER_AUTH_SECRET");

  const key = Buffer.from(
    hkdfSync("sha256", Redacted.value(secret), new Uint8Array(0), KEY_PURPOSE, KEY_BYTES),
  );

  const seal = (value: Redacted.Redacted) =>
    Effect.sync(() => {
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv(ALGORITHM, key, iv);

      const ciphertext = Buffer.concat([
        cipher.update(Redacted.value(value), "utf8"),
        cipher.final(),
      ]);

      return [VERSION, iv, cipher.getAuthTag(), ciphertext]
        .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
        .join(".");
    });

  const open = (sealed: string) =>
    Effect.try({
      try: () => {
        const [version, iv, tag, ciphertext] = sealed.split(".");

        if (
          version !== VERSION ||
          iv === undefined ||
          tag === undefined ||
          ciphertext === undefined
        ) {
          throw new Error("Unknown format");
        }

        const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64url"));

        decipher.setAuthTag(Buffer.from(tag, "base64url"));

        const plaintext = Buffer.concat([
          decipher.update(Buffer.from(ciphertext, "base64url")),
          decipher.final(),
        ]);

        return Redacted.make(plaintext.toString("utf8"));
      },
      catch: () => new SecretBoxError(),
    });

  return SecretBox.of({ seal, open });
});

/**
 * A sealed value that cannot be opened: it was changed, or `BETTER_AUTH_SECRET` changed since it
 * was sealed. An admin must enter the secret again.
 */
export class SecretBoxError extends Schema.TaggedError<SecretBoxError>()("SecretBoxError", {}) {}

/** Encrypts secrets that admins enter, such as the Resend API key, before they are stored. */
export class SecretBox extends Context.Service<SecretBox, SecretBoxService>()("web/SecretBox") {}

/**
 * AES-256-GCM with a key derived from `BETTER_AUTH_SECRET`. A copy of the database alone does not
 * reveal the secrets; changing `BETTER_AUTH_SECRET` makes the stored ones unreadable, and the
 * admin enters them again.
 */
export const SecretBoxLive = Layer.effect(SecretBox, makeSecretBox);

/** Seals and opens secrets. A sealed value is text, safe to store. */
type SecretBoxService = {
  readonly seal: (value: Redacted.Redacted) => Effect.Effect<string>;
  readonly open: (sealed: string) => Effect.Effect<Redacted.Redacted, SecretBoxError>;
};

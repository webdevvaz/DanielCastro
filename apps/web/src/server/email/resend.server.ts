import "@tanstack/react-start/server-only";
import { Context, Effect, Encoding, Layer, Option, type Redacted, Schema } from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { describeHttpFailure } from "../describe-http-failure";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";

/** An enquiry carries up to 25 photos, several megabytes to upload. */
const REQUEST_TIMEOUT = "45 seconds";

/** Resend's explanation can reach the admin; a longer one is cut. */
const MAX_REASON_LENGTH = 300;

const SentEmail = Schema.Struct({ id: Schema.String });

/** Resend's error body, for example `{ "statusCode": 403, "message": "The domain is not verified" }`. */
const ResendProblem = Schema.Struct({ message: Schema.String });

/** Resend's explanation of a refusal, or the status alone when the body has none. */
const refusalReason = (response: HttpClientResponse.HttpClientResponse) =>
  HttpClientResponse.schemaBodyJson(ResendProblem)(response).pipe(
    Effect.map((problem) => problem.message.slice(0, MAX_REASON_LENGTH)),
    Effect.orElseSucceed(() => `Resend answered with status ${String(response.status)}`),
  );

const makeResend = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;

  const send = (apiKey: Redacted.Redacted, email: OutgoingEmail) =>
    client
      .execute(
        HttpClientRequest.post(RESEND_EMAILS_URL).pipe(
          HttpClientRequest.bearerToken(apiKey),
          HttpClientRequest.bodyJsonUnsafe({
            from: email.from,
            to: email.to,
            reply_to: Option.getOrUndefined(email.replyTo),
            subject: email.subject,
            html: email.html,
            text: email.text,
            attachments: email.attachments.map((attachment) => ({
              filename: attachment.filename,
              content: Encoding.encodeBase64(attachment.content),
            })),
          }),
        ),
      )
      .pipe(
        Effect.timeout(REQUEST_TIMEOUT),
        Effect.mapError((error) => new ResendError({ cause: describeHttpFailure(error) })),
        Effect.flatMap((response): Effect.Effect<string, ResendError | ResendRejected> =>
          response.status >= 400 && response.status < 500
            ? Effect.flatMap(refusalReason(response), (reason) =>
                Effect.fail(new ResendRejected({ status: response.status, reason })),
              )
            : HttpClientResponse.filterStatusOk(response).pipe(
                Effect.flatMap(HttpClientResponse.schemaBodyJson(SentEmail)),
                Effect.map((sent) => sent.id),
                Effect.mapError((error) => new ResendError({ cause: describeHttpFailure(error) })),
              ),
        ),
        // The HTTP client can record request headers in traces, and the API key is one.
        Effect.provideService(HttpClient.TracerDisabledWhen, () => true),
        Effect.withSpan("resend.send"),
      );

  return Resend.of({ send });
});

/** Resend could not be reached, failed, or answered with something unexpected. */
export class ResendError extends Schema.TaggedError<ResendError>()("ResendError", {
  /** A short description that never includes the API key. */
  cause: Schema.String,
}) {}

/**
 * Resend refused the email: a wrong or revoked API key (401, 403), a sender on a domain that is
 * not verified (403), a malformed address (422), or too many emails (429). `reason` is Resend's
 * explanation, which the admin can read.
 */
export class ResendRejected extends Schema.TaggedError<ResendRejected>()("ResendRejected", {
  status: Schema.Int,
  reason: Schema.String,
}) {}

/** Sends email through Resend's API with an API key an admin saved. */
export class Resend extends Context.Service<Resend, ResendService>()("web/Resend") {}

/** Resend over HTTP. The API key comes with each email, because an admin can change it any time. */
export const ResendLive = Layer.effect(Resend, makeResend);

/** What the Resend service offers. */
type ResendService = {
  /** Sends one email and returns Resend's ID for it. */
  readonly send: (
    apiKey: Redacted.Redacted,
    email: OutgoingEmail,
  ) => Effect.Effect<string, ResendError | ResendRejected>;
};

/** One email. `from` is an address on a domain verified in Resend, alone or with a name. */
export type OutgoingEmail = {
  readonly from: string;
  readonly to: ReadonlyArray<string>;
  readonly replyTo: Option.Option<string>;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly attachments: ReadonlyArray<{ readonly filename: string; readonly content: Uint8Array }>;
};

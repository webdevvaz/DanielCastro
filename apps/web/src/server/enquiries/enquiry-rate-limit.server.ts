import "@tanstack/react-start/server-only";
import { TooManyRequestsError } from "@daniel/shared/errors";
import { Clock, Config, Context, Duration, Effect, Layer, Option, Ref } from "effect";

import { RequestHeaders } from "../request-headers.server";

/** How far back the limits count enquiries. */
const WINDOW = Duration.hours(1);

/** Most enquiries one client address may send within the window. */
const PER_CLIENT_LIMIT = 5;

/**
 * Most enquiries the whole site accepts within the window. It stops a flood from many addresses,
 * and it is the only limit when the server cannot see client addresses.
 */
const TOTAL_LIMIT = 30;

const tooMany = () =>
  new TooManyRequestsError({ reason: "Too many enquiries were sent. Try again in an hour." });

/**
 * The client address in the proxy header, or none without a header name. A proxy may list
 * several addresses (`client, proxy`); the first one is the client's.
 */
const clientAddress = (headers: Headers, headerName: Option.Option<string>) =>
  headerName.pipe(
    Option.flatMap((name) => Option.fromNullishOr(headers.get(name))),
    Option.map((value) => value.split(",").at(0)?.trim() ?? ""),
    Option.filter((address) => address !== ""),
  );

const makeEnquiryRateLimit = Effect.gen(function* () {
  // The same header the sign-in rate limit reads; see docs/deploy.md.
  const headerName = yield* Config.option(Config.String("AUTH_IP_ADDRESS_HEADER"));

  const sent = yield* Ref.make<ReadonlyArray<SentEnquiry>>([]);

  const take = Effect.gen(function* () {
    const headers = yield* RequestHeaders;
    const address = clientAddress(headers, headerName);

    const now = yield* Clock.currentTimeMillis;
    const windowStart = now - Duration.toMillis(WINDOW);

    const allowed = yield* Ref.modify(sent, (history) => {
      const recent = history.filter((entry) => entry.at > windowStart);

      const fromClient = Option.match(address, {
        onNone: () => 0,
        onSome: (client) => recent.filter((entry) => entry.address === client).length,
      });

      if (recent.length >= TOTAL_LIMIT || fromClient >= PER_CLIENT_LIMIT) {
        return [false, recent] as const;
      }

      return [true, [...recent, { at: now, address: Option.getOrNull(address) }]] as const;
    });

    if (!allowed) {
      yield* Effect.logWarning("Enquiry refused by the rate limit").pipe(
        Effect.annotateLogs({ clientKnown: Option.isSome(address) }),
      );

      return yield* tooMany();
    }
  });

  return EnquiryRateLimit.of({ take });
});

/**
 * Limits how many enquiries the site accepts: a few per client address and a ceiling for the whole
 * site, within the last hour. The counts live in this server process, so they restart with it;
 * that is enough for one replica. With several replicas, keep the counts in the database.
 */
export class EnquiryRateLimit extends Context.Service<EnquiryRateLimit, EnquiryRateLimitService>()(
  "web/EnquiryRateLimit",
) {}

/** The enquiry rate limit with empty counts. */
export const EnquiryRateLimitLive = Layer.effect(EnquiryRateLimit, makeEnquiryRateLimit);

/** One accepted enquiry: when, in epoch milliseconds, and from which address, if known. */
type SentEnquiry = {
  readonly at: number;
  readonly address: string | null;
};

/** Counts one enquiry, or fails with `TooManyRequestsError` and counts nothing. */
type EnquiryRateLimitService = {
  readonly take: Effect.Effect<void, TooManyRequestsError, RequestHeaders>;
};

import "@tanstack/react-start/server-only";
import type { Locale } from "@daniel/shared/locales";
import type { ShopCheckoutInput } from "@daniel/shared/shop";

import { ConflictError, NotFoundError, ServiceUnavailableError } from "@daniel/shared/errors";
import { Effect } from "effect";

import { Shopify, type ShopCatalog } from "./shopify.server";

/** Logs why Shopify failed and reports only that the shop is unavailable. */
const unavailable = (error: unknown) =>
  Effect.logWarning("A Shopify request failed", error).pipe(
    Effect.andThen(Effect.fail(new ServiceUnavailableError({ service: "Shop" }))),
  );

/**
 * The shop page's products and collections. A shop that is not set up, or Shopify being down, is
 * a status and not a failure, so the page can link to the shop's own site instead.
 */
export const getShopCatalog = Effect.fn("getShopCatalog")(function* (locale: Locale) {
  const shopify = yield* Shopify;

  if (!shopify.configured) return { status: "not_configured", catalog: null } satisfies ShopView;

  return yield* shopify.catalog(locale).pipe(
    Effect.map((catalog) => ({ status: "ready", catalog }) satisfies ShopView),
    Effect.catchTag("ShopifyError", (error) =>
      Effect.logWarning("Could not read the shop catalog", error).pipe(
        Effect.as({ status: "unavailable", catalog: null } satisfies ShopView),
      ),
    ),
  );
});

/** One product's page. Fails with `NotFoundError` when the shop has no product with the handle. */
export const getShopProduct = Effect.fn("getShopProduct")(function* (
  locale: Locale,
  handle: string,
) {
  const shopify = yield* Shopify;

  const product = yield* shopify
    .product(locale, handle)
    .pipe(Effect.catchTag("ShopifyError", unavailable));

  if (product === null) return yield* new NotFoundError({ resource: "Product" });

  return product;
});

/**
 * "Buy now": a new Shopify checkout with one variant, and the address to send the visitor to.
 * Fails with `ConflictError` when Shopify refuses the line, for example because the size sold out
 * meanwhile, and with `ServiceUnavailableError` when Shopify cannot be reached.
 */
export const startShopCheckout = Effect.fn("startShopCheckout")(function* (
  input: ShopCheckoutInput,
) {
  const shopify = yield* Shopify;

  const checkoutUrl = yield* shopify.createCheckout([input]).pipe(
    Effect.catchTag("ShopifyError", unavailable),
    Effect.catchTag("ShopifyCheckoutRejected", (rejected) =>
      Effect.logInfo("Shopify refused a checkout", rejected).pipe(
        Effect.andThen(
          Effect.fail(new ConflictError({ reason: "This item cannot be bought now" })),
        ),
      ),
    ),
  );

  return { checkoutUrl };
});

/** The shop page's data, or why there is none. */
export type ShopView =
  | { readonly status: "ready"; readonly catalog: ShopCatalog }
  | { readonly status: "not_configured" | "unavailable"; readonly catalog: null };

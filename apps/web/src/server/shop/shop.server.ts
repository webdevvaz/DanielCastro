import "@tanstack/react-start/server-only";
import type { Locale } from "@daniel/shared/locales";
import type {
  AddToShopCartInput,
  ShopCheckoutInput,
  UpdateShopCartLineInput,
} from "@daniel/shared/shop";

import { ConflictError, NotFoundError, ServiceUnavailableError } from "@daniel/shared/errors";
import { ShopCartId } from "@daniel/shared/shop";
import { Effect, Option, Schema } from "effect";

import { cookieValue } from "@/i18n/cookie-value";
import { SHOP_CART_COOKIE } from "@/shop/cart-cookie";

import { RequestHeaders } from "../request-headers.server";
import { Shopify, type ShopCart, type ShopCatalog } from "./shopify.server";

const decodeCartId = Schema.decodeUnknownOption(ShopCartId);

/** Logs why Shopify failed and reports only that the shop is unavailable. */
const unavailable = (error: unknown) =>
  Effect.logWarning("A Shopify request failed", error).pipe(
    Effect.andThen(Effect.fail(new ServiceUnavailableError({ service: "Shop" }))),
  );

/** Logs a refused line and reports it as a conflict, so the page can say it sold out. */
const refused = (rejected: unknown) =>
  Effect.logInfo("Shopify refused a cart line", rejected).pipe(
    Effect.andThen(Effect.fail(new ConflictError({ reason: "This item cannot be bought now" }))),
  );

/** URL-decodes a cookie value; a malformed one is no value. */
const decodedCookie = (value: string) => {
  try {
    return Option.some(decodeURIComponent(value));
  } catch {
    return Option.none();
  }
};

/**
 * The cart ID in the visitor's cookie. The cookie is visitor input: a value that is not a Shopify
 * cart ID counts as no cart.
 */
const cookieCartId = Effect.gen(function* () {
  const headers = yield* RequestHeaders;

  return Option.fromNullishOr(cookieValue(headers.get("cookie"), SHOP_CART_COOKIE)).pipe(
    Option.flatMap(decodedCookie),
    Option.flatMap(decodeCartId),
  );
});

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

  const checkoutUrl = yield* shopify
    .createCheckout([input])
    .pipe(
      Effect.catchTag("ShopifyError", unavailable),
      Effect.catchTag("ShopifyCartRejected", refused),
    );

  return { checkoutUrl };
});

/**
 * The visitor's cart, from the cart ID in their cookie, with names in a language. No cookie, or a
 * cart Shopify no longer has (ordered or expired), is an empty cart. Shopify being down is a
 * status and not a failure, so every page can render.
 */
export const getShopCart = Effect.fn("getShopCart")(function* (locale: Locale) {
  const cartId = yield* cookieCartId;

  const shopify = yield* Shopify;

  if (Option.isNone(cartId) || !shopify.configured) {
    return { status: "ready", cart: null } satisfies ShopCartView;
  }

  return yield* shopify.cart(locale, cartId.value).pipe(
    Effect.map((cart) => ({ status: "ready", cart }) satisfies ShopCartView),
    Effect.catchTag("ShopifyError", (error) =>
      Effect.logWarning("Could not read a cart", error).pipe(
        Effect.as({ status: "unavailable", cart: null } satisfies ShopCartView),
      ),
    ),
  );
});

/**
 * "Add to cart": adds a variant to the visitor's cart, or starts a cart when they have none or
 * Shopify no longer has theirs. Returns the cart, whose ID the browser keeps, and whether stock
 * allowed fewer items than asked. Fails with
 * `ConflictError` when Shopify refuses the line, for example because the size sold out.
 */
export const addToShopCart = Effect.fn("addToShopCart")(
  function* (input: AddToShopCartInput) {
    const cartId = yield* cookieCartId;

    const shopify = yield* Shopify;

    const lines = [{ variantId: input.variantId, quantity: input.quantity }];

    const existing = Option.isSome(cartId)
      ? yield* shopify.addCartLines(input.locale, cartId.value, lines)
      : null;

    return existing ?? (yield* shopify.createCart(input.locale, lines));
  },
  (effect) =>
    effect.pipe(
      Effect.catchTag("ShopifyError", unavailable),
      Effect.catchTag("ShopifyCartRejected", refused),
    ),
);

/**
 * Sets how many of a line the cart holds; 0 removes the line. Returns the cart and whether stock
 * allowed fewer items than asked, or null when the
 * visitor has no cart or Shopify no longer has it. Fails with `ConflictError` when Shopify refuses
 * the quantity.
 */
export const updateShopCartLine = Effect.fn("updateShopCartLine")(
  function* (input: UpdateShopCartLineInput) {
    const cartId = yield* cookieCartId;

    if (Option.isNone(cartId)) return null;

    const shopify = yield* Shopify;

    return yield* shopify.updateCartLines(input.locale, cartId.value, [
      { lineId: input.lineId, quantity: input.quantity },
    ]);
  },
  (effect) =>
    effect.pipe(
      Effect.catchTag("ShopifyError", unavailable),
      Effect.catchTag("ShopifyCartRejected", refused),
    ),
);

/** The shop page's data, or why there is none. */
export type ShopView =
  | { readonly status: "ready"; readonly catalog: ShopCatalog }
  | { readonly status: "not_configured" | "unavailable"; readonly catalog: null };

/** The visitor's cart (null when empty), or that Shopify could not be reached. */
export type ShopCartView =
  | { readonly status: "ready"; readonly cart: ShopCart | null }
  | { readonly status: "unavailable"; readonly cart: null };

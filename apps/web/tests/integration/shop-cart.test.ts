import { layer } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { describe, expect } from "vite-plus/test";

import { RequestHeaders } from "../../src/server/request-headers.server";
import { addToShopCart, getShopCart, updateShopCartLine } from "../../src/server/shop/shop.server";
import { ShopifyLive } from "../../src/server/shop/shopify.server";
import { SHOP_CART_COOKIE } from "../../src/shop/cart-cookie";

const CART_ID = "gid://shopify/Cart/hWNJ6UbB2tAWL3PnHnedr5l5?key=9175571464cdcb84b7a642814769468d";

const GONE_CART_ID = "gid://shopify/Cart/hWNJ6UbB2tAWLgonegone?key=0000";

const LINE_ID =
  "gid://shopify/CartLine/2aa000d8-be6f-4a57-89d9-78ae9541ea3a?cart=hWNJ6UbB2tAWL3PnHnedr5l5";

const VARIANT = "gid://shopify/ProductVariant/1001";

const SOLD_OUT_VARIANT = "gid://shopify/ProductVariant/1002";

const money = (amount: string) => ({ amount, currencyCode: "EUR" });

/** A cart as Shopify sends it, with one line of `quantity` items. */
const cartFields = (quantity: number) => ({
  id: CART_ID,
  checkoutUrl: "https://shop.example/cart/c/abc?key=1",
  totalQuantity: quantity,
  cost: { subtotalAmount: money(String(29.99 * quantity)) },
  lines: {
    nodes: [
      {
        id: LINE_ID,
        quantity,
        cost: { totalAmount: money(String(29.99 * quantity)), amountPerQuantity: money("29.99") },
        merchandise: {
          id: VARIANT,
          availableForSale: true,
          selectedOptions: [{ name: "Size", value: "M" }],
          image: null,
          product: { handle: "dark-virgo", title: "Dark Virgo", featuredImage: null },
        },
      },
    ],
  },
});

const payload = (cart: unknown, userErrors: unknown[] = [], warnings: unknown[] = []) => ({
  cart,
  userErrors,
  warnings,
});

type Request = {
  readonly operation: string;
  readonly variables: Record<string, unknown>;
  readonly traced: boolean;
};

/** A fake Storefront API that answers cart requests the way Shopify does. */
const answer = (query: string, variables: Record<string, unknown>) => {
  const lines = (variables.lines ?? []) as ReadonlyArray<{
    merchandiseId?: string;
    quantity: number;
  }>;

  if (query.includes("cartCreate")) {
    return { cartCreate: payload(cartFields(lines.at(0)?.quantity ?? 1)) };
  }

  if (query.includes("cartLinesAdd")) {
    // Shopify answers an unknown cart with a problem on `cartId` (and an empty new cart).
    if (variables.cartId === GONE_CART_ID) {
      return {
        cartLinesAdd: payload(cartFields(0), [
          { message: "The specified cart does not exist.", field: ["cartId"] },
        ]),
      };
    }

    if (lines.at(0)?.merchandiseId === SOLD_OUT_VARIANT) {
      return {
        cartLinesAdd: payload(null, [
          { message: "The product is sold out.", field: ["lines", "0", "merchandiseId"] },
        ]),
      };
    }

    return { cartLinesAdd: payload(cartFields(2)) };
  }

  if (query.includes("cartLinesUpdate")) {
    // Two are in stock: a larger quantity is cut to two, with a warning.
    const asked = lines.at(0)?.quantity ?? 0;

    return {
      cartLinesUpdate: payload(
        cartFields(Math.min(asked, 2)),
        [],
        asked > 2 ? [{ code: "MERCHANDISE_NOT_ENOUGH_STOCK" }] : [],
      ),
    };
  }

  return { cart: cartFields(1) };
};

const requests: Request[] = [];

const client = HttpClient.make((request, _url, _signal, fiber) => {
  const body =
    request.body._tag === "Uint8Array" ? new TextDecoder().decode(request.body.body) : "";
  const { query, variables } = JSON.parse(body) as {
    query: string;
    variables: Record<string, unknown>;
  };

  requests.push({
    operation: /(?:query|mutation) (\w+)/.exec(query)?.at(1) ?? "unknown",
    variables,
    traced: !fiber.getRef(HttpClient.TracerDisabledWhen)(request),
  });

  return Effect.succeed(
    HttpClientResponse.fromWeb(
      request,
      new Response(JSON.stringify({ data: answer(query, variables) }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ),
  );
});

const ShopLive = ShopifyLive.pipe(
  Layer.provide(Layer.succeed(HttpClient.HttpClient, client)),
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromUnknown({
        SHOPIFY_STORE_DOMAIN: "test-shop.myshopify.com",
        SHOPIFY_STOREFRONT_TOKEN: "test-storefront-token",
      }),
    ),
  ),
);

/** Request headers with a cart cookie holding `cookieValue` as the browser stores it. */
const withCartCookie = (cookieValue: string | null) =>
  Effect.provideService(
    RequestHeaders,
    new Headers(
      cookieValue === null ? {} : { cookie: `locale=pt; ${SHOP_CART_COOKIE}=${cookieValue}` },
    ),
  );

/** The operations Shopify received since `from`. */
const operationsSince = (from: number) => requests.slice(from).map(({ operation }) => operation);

/**
 * The cart against a fake Shopify. The cart ID comes from a cookie the visitor controls: only a
 * well-formed ID may reach Shopify, a lost cart must never block "Add to cart", and the token must
 * never reach a trace.
 */
describe("shop cart", () => {
  layer(ShopLive)("a working shop", (it) => {
    it.effect(
      "starts a cart for a visitor without one, then adds to the cart in their cookie",
      () =>
        Effect.gen(function* () {
          const before = requests.length;

          const first = yield* addToShopCart({
            locale: "pt",
            variantId: VARIANT,
            quantity: 1,
          }).pipe(withCartCookie(null));
          const second = yield* addToShopCart({
            locale: "pt",
            variantId: VARIANT,
            quantity: 1,
          }).pipe(withCartCookie(encodeURIComponent(CART_ID)));

          expect(first.cart.id).toBe(CART_ID);
          expect(second.cart.totalQuantity).toBe(2);
          expect(operationsSince(before)).toEqual(["CartCreate", "CartLinesAdd"]);
          expect(requests.at(-1)?.variables).toMatchObject({ cartId: CART_ID, language: "PT_PT" });
          expect(requests.slice(before).every(({ traced }) => !traced)).toBe(true);
        }),
    );

    it.effect("starts a new cart when Shopify lost the visitor's, or the cookie is malformed", () =>
      Effect.gen(function* () {
        const lostFrom = requests.length;

        const afterLost = yield* addToShopCart({
          locale: "en",
          variantId: VARIANT,
          quantity: 1,
        }).pipe(withCartCookie(encodeURIComponent(GONE_CART_ID)));

        expect(afterLost.cart.id).toBe(CART_ID);
        expect(operationsSince(lostFrom)).toEqual(["CartLinesAdd", "CartCreate"]);

        const malformedFrom = requests.length;

        yield* addToShopCart({ locale: "en", variantId: VARIANT, quantity: 1 }).pipe(
          withCartCookie(encodeURIComponent(`${CART_ID}&lines=99`)),
        );
        yield* addToShopCart({ locale: "en", variantId: VARIANT, quantity: 1 }).pipe(
          withCartCookie("%E0%A4%A"),
        );

        expect(operationsSince(malformedFrom)).toEqual(["CartCreate", "CartCreate"]);
      }),
    );

    it.effect(
      "says when stock allowed fewer items, and refuses a sold-out size as a conflict",
      () =>
        Effect.gen(function* () {
          const limited = yield* updateShopCartLine({
            locale: "en",
            lineId: LINE_ID,
            quantity: 5,
          }).pipe(withCartCookie(encodeURIComponent(CART_ID)));

          const refused = yield* addToShopCart({
            locale: "en",
            variantId: SOLD_OUT_VARIANT,
            quantity: 1,
          }).pipe(withCartCookie(encodeURIComponent(CART_ID)), Effect.flip);

          expect(limited).toMatchObject({ limitedByStock: true, cart: { totalQuantity: 2 } });
          expect(refused._tag).toBe("ConflictError");
        }),
    );

    it.effect(
      "shows an empty cart, and changes nothing, without asking Shopify when there is no cookie",
      () =>
        Effect.gen(function* () {
          const before = requests.length;

          const view = yield* getShopCart("fr").pipe(withCartCookie(null));
          const update = yield* updateShopCartLine({
            locale: "fr",
            lineId: LINE_ID,
            quantity: 0,
          }).pipe(withCartCookie(null));

          expect(view).toEqual({ status: "ready", cart: null });
          expect(update).toBeNull();
          expect(requests.length).toBe(before);
        }),
    );
  });
});

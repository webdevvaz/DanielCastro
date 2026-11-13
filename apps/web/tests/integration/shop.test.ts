import { layer } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { describe, expect } from "vite-plus/test";

import { getShopCatalog, startShopCheckout } from "../../src/server/shop/shop.server";
import { ShopifyLive } from "../../src/server/shop/shopify.server";

const TOKEN = "test-storefront-token";

const DOMAIN = "test-shop.myshopify.com";

const VARIANT = "gid://shopify/ProductVariant/1001";

const money = (amount: string) => ({ amount, currencyCode: "EUR" });

const card = (handle: string, available: boolean) => ({
  handle,
  title: handle,
  availableForSale: available,
  priceRange: { minVariantPrice: money("29.99"), maxVariantPrice: money("29.99") },
  featuredImage: {
    url: `https://cdn.shopify.com/${handle}.jpg`,
    altText: null,
    width: 900,
    height: 1125,
  },
});

/** Three products; "everything" holds all of them, so it is no filter. */
const catalog = {
  data: {
    collections: {
      nodes: [
        {
          handle: "prints",
          title: "Prints",
          products: { nodes: [{ handle: "print-zoro" }] },
        },
        {
          handle: "everything",
          title: "Everything",
          products: {
            nodes: [{ handle: "print-zoro" }, { handle: "dark-virgo" }, { handle: "dark-leo" }],
          },
        },
      ],
    },
    products: {
      nodes: [card("print-zoro", true), card("dark-virgo", true), card("dark-leo", false)],
    },
  },
};

type Answer = { readonly status: number; readonly body: unknown };

/**
 * The shop service on a fake Shopify that answers every request with `answer`. Records each
 * request's address, token header, query, and whether the HTTP client traced it.
 */
const shopWith = (answer: (query: string) => Answer, settings: Record<string, string>) => {
  const requests: Array<{
    url: string;
    token: string | undefined;
    query: string;
    traced: boolean;
  }> = [];

  const client = HttpClient.make((request, url, _signal, fiber) => {
    const body =
      request.body._tag === "Uint8Array" ? new TextDecoder().decode(request.body.body) : "";
    const { query } = JSON.parse(body) as { query: string };

    requests.push({
      url: url.toString(),
      token: request.headers["x-shopify-storefront-access-token"],
      query,
      traced: !fiber.getRef(HttpClient.TracerDisabledWhen)(request),
    });

    const { status, body: responseBody } = answer(query);

    return Effect.succeed(
      HttpClientResponse.fromWeb(
        request,
        new Response(JSON.stringify(responseBody), {
          status,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
  });

  const live = ShopifyLive.pipe(
    Layer.provide(Layer.succeed(HttpClient.HttpClient, client)),
    Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(settings))),
  );

  return { live, requests };
};

const configured = { SHOPIFY_STORE_DOMAIN: DOMAIN, SHOPIFY_STOREFRONT_TOKEN: TOKEN };

/**
 * The shop against a fake Shopify: what the shop page shows, "Buy now", and what happens when
 * Shopify refuses, fails, or is not set up. The token must never reach a trace or an error.
 */
describe("shop", () => {
  const working = shopWith(
    (query) =>
      query.includes("cartCreate")
        ? {
            status: 200,
            body: {
              data: {
                cartCreate: {
                  cart: { checkoutUrl: "https://shop.example/cart/c/abc?key=1" },
                  userErrors: [],
                },
              },
            },
          }
        : { status: 200, body: catalog },
    configured,
  );

  layer(working.live)("a working shop", (it) => {
    it.effect("lists the products and leaves out a collection that holds every product", () =>
      Effect.gen(function* () {
        const view = yield* getShopCatalog("pt");

        expect(view.status).toBe("ready");
        expect(
          view.catalog?.products.map(({ handle, available }) => ({ handle, available })),
        ).toEqual([
          { handle: "print-zoro", available: true },
          { handle: "dark-virgo", available: true },
          { handle: "dark-leo", available: false },
        ]);
        expect(view.catalog?.collections.map(({ handle }) => handle)).toEqual(["prints"]);

        const request = working.requests.at(-1);

        expect(request?.url).toBe(`https://${DOMAIN}/api/2025-10/graphql.json`);
        expect(request?.token).toBe(TOKEN);
        expect(request?.traced).toBe(false);
      }),
    );

    it.effect("starts a checkout for the chosen variant and returns Shopify's address", () =>
      Effect.gen(function* () {
        const result = yield* startShopCheckout({ variantId: VARIANT, quantity: 2 });

        expect(result.checkoutUrl).toBe("https://shop.example/cart/c/abc?key=1");
        expect(working.requests.at(-1)?.traced).toBe(false);
      }),
    );
  });

  const refusing = shopWith(
    () => ({
      status: 200,
      body: {
        data: {
          cartCreate: { cart: null, userErrors: [{ message: "The variant is sold out" }] },
        },
      },
    }),
    configured,
  );

  layer(refusing.live)("a shop that refuses the line", (it) => {
    it.effect("reports a refused line as a conflict, so the page can say it sold out", () =>
      Effect.gen(function* () {
        const error = yield* startShopCheckout({ variantId: VARIANT, quantity: 1 }).pipe(
          Effect.flip,
        );

        expect(error._tag).toBe("ConflictError");
      }),
    );
  });

  const failing = shopWith(
    () => ({ status: 503, body: { errors: "Service unavailable" } }),
    configured,
  );

  layer(failing.live)("a shop that fails", (it) => {
    it.effect("shows the page as unavailable and never puts the token in an error", () =>
      Effect.gen(function* () {
        const view = yield* getShopCatalog("en");
        const error = yield* startShopCheckout({ variantId: VARIANT, quantity: 1 }).pipe(
          Effect.flip,
        );

        expect(view).toEqual({ status: "unavailable", catalog: null });
        expect(error._tag).toBe("ServiceUnavailableError");
        expect(JSON.stringify(error)).not.toContain(TOKEN);
      }),
    );
  });

  const unconfigured = shopWith(() => ({ status: 200, body: catalog }), {});

  layer(unconfigured.live)("a shop without settings", (it) => {
    it.effect("shows the page as not set up and sends no request", () =>
      Effect.gen(function* () {
        const view = yield* getShopCatalog("en");
        const error = yield* startShopCheckout({ variantId: VARIANT, quantity: 1 }).pipe(
          Effect.flip,
        );

        expect(view).toEqual({ status: "not_configured", catalog: null });
        expect(error._tag).toBe("ServiceUnavailableError");
        expect(unconfigured.requests).toHaveLength(0);
      }),
    );
  });
});

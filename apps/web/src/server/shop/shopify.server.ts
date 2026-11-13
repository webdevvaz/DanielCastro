import "@tanstack/react-start/server-only";
import type { Locale } from "@daniel/shared/locales";

import {
  Cache,
  Config,
  Context,
  Data,
  type Duration,
  Effect,
  Exit,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { describeHttpFailure } from "../describe-http-failure";

/** The Storefront API version the queries below are written for. */
const API_VERSION = "2025-10";

/** Products and prices change a few times a month; a new product shows within this time. */
const CATALOG_TIME_TO_LIVE = "10 minutes";

/** A failed lookup is retried soon, but not on every page view. */
const FAILURE_TIME_TO_LIVE = "1 minute";

const REQUEST_TIMEOUT = "10 seconds";

/** Shopify's language codes for the site languages. Without a translation, Shopify sends the shop's own text. */
const SHOPIFY_LANGUAGES: Record<Locale, string> = {
  en: "EN",
  pt: "PT_PT",
  fr: "FR",
  de: "DE",
  es: "ES",
};

/** Image sizes from Shopify's image service: grid tiles and the product page. */
const CARD_IMAGE_WIDTH = 900;
const PRODUCT_IMAGE_WIDTH = 1600;

const CATALOG_QUERY = `
query Catalog($language: LanguageCode) @inContext(language: $language) {
  collections(first: 20) {
    nodes { handle title products(first: 250) { nodes { handle } } }
  }
  products(first: 250, sortKey: CREATED_AT, reverse: true) {
    nodes {
      handle
      title
      availableForSale
      priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
      featuredImage { url(transform: { maxWidth: ${CARD_IMAGE_WIDTH} }) altText width height }
    }
  }
}`;

const PRODUCT_QUERY = `
query Product($handle: String!, $language: LanguageCode) @inContext(language: $language) {
  product(handle: $handle) {
    handle
    title
    description
    availableForSale
    onlineStoreUrl
    options { name optionValues { name } }
    images(first: 10) {
      nodes { url(transform: { maxWidth: ${PRODUCT_IMAGE_WIDTH} }) altText width height }
    }
    variants(first: 100) {
      nodes { id availableForSale price { amount currencyCode } selectedOptions { name value } }
    }
  }
}`;

const CHECKOUT_MUTATION = `
mutation Checkout($lines: [CartLineInput!]!) {
  cartCreate(input: { lines: $lines }) {
    cart { checkoutUrl }
    userErrors { message }
  }
}`;

const Money = Schema.Struct({ amount: Schema.String, currencyCode: Schema.String });

const Image = Schema.Struct({
  url: Schema.String,
  altText: Schema.NullOr(Schema.String),
  width: Schema.NullOr(Schema.Finite),
  height: Schema.NullOr(Schema.Finite),
});

const CatalogData = Schema.Struct({
  collections: Schema.Struct({
    nodes: Schema.Array(
      Schema.Struct({
        handle: Schema.String,
        title: Schema.String,
        products: Schema.Struct({ nodes: Schema.Array(Schema.Struct({ handle: Schema.String })) }),
      }),
    ),
  }),
  products: Schema.Struct({
    nodes: Schema.Array(
      Schema.Struct({
        handle: Schema.String,
        title: Schema.String,
        availableForSale: Schema.Boolean,
        priceRange: Schema.Struct({ minVariantPrice: Money, maxVariantPrice: Money }),
        featuredImage: Schema.NullOr(Image),
      }),
    ),
  }),
});

const ProductData = Schema.Struct({
  product: Schema.NullOr(
    Schema.Struct({
      handle: Schema.String,
      title: Schema.String,
      description: Schema.String,
      availableForSale: Schema.Boolean,
      onlineStoreUrl: Schema.NullOr(Schema.String),
      options: Schema.Array(
        Schema.Struct({
          name: Schema.String,
          optionValues: Schema.Array(Schema.Struct({ name: Schema.String })),
        }),
      ),
      images: Schema.Struct({ nodes: Schema.Array(Image) }),
      variants: Schema.Struct({
        nodes: Schema.Array(
          Schema.Struct({
            id: Schema.String,
            availableForSale: Schema.Boolean,
            price: Money,
            selectedOptions: Schema.Array(
              Schema.Struct({ name: Schema.String, value: Schema.String }),
            ),
          }),
        ),
      }),
    }),
  ),
});

/** Shopify's checkout pages are always on HTTPS; anything else is not a checkout to send people to. */
const CheckoutUrl = Schema.String.check(
  Schema.makeFilter((url: string) => URL.canParse(url) && new URL(url).protocol === "https:"),
);

const CheckoutData = Schema.Struct({
  cartCreate: Schema.NullOr(
    Schema.Struct({
      cart: Schema.NullOr(Schema.Struct({ checkoutUrl: CheckoutUrl })),
      userErrors: Schema.Array(Schema.Struct({ message: Schema.String })),
    }),
  ),
});

/** The GraphQL answer around `data`: Shopify reports query problems in `errors`, with status 200. */
const GraphQlResponse = <S extends Schema.Constraint>(data: S) =>
  Schema.Struct({
    data: Schema.optional(Schema.NullOr(data)),
    errors: Schema.optional(Schema.Array(Schema.Struct({ message: Schema.String }))),
  });

const timeToLive = (exit: Exit.Exit<unknown, unknown>): Duration.Input =>
  Exit.isSuccess(exit) ? CATALOG_TIME_TO_LIVE : FAILURE_TIME_TO_LIVE;

const imageOf = (image: typeof Image.Type): ShopImage => ({
  url: image.url,
  alt: image.altText,
  width: image.width,
  height: image.height,
});

const priceOf = (money: typeof Money.Type): ShopPrice => ({
  amount: Number(money.amount),
  currency: money.currencyCode,
});

/**
 * The catalog for the shop page. A collection that holds every product is no filter, so it is
 * left out, and so are empty ones.
 */
const catalogOf = (data: typeof CatalogData.Type): ShopCatalog => {
  const products = data.products.nodes.map((product): ShopProductCard => ({
    handle: product.handle,
    title: product.title,
    available: product.availableForSale,
    price: priceOf(product.priceRange.minVariantPrice),
    priceVaries:
      Number(product.priceRange.maxVariantPrice.amount) >
      Number(product.priceRange.minVariantPrice.amount),
    image: product.featuredImage === null ? null : imageOf(product.featuredImage),
  }));

  const collections = data.collections.nodes
    .map((collection) => ({
      handle: collection.handle,
      title: collection.title,
      productHandles: collection.products.nodes.map((product) => product.handle),
    }))
    .filter(
      (collection) =>
        collection.productHandles.length > 0 && collection.productHandles.length < products.length,
    );

  return { collections, products };
};

const productOf = (product: NonNullable<typeof ProductData.Type.product>): ShopProduct => ({
  handle: product.handle,
  title: product.title,
  description: product.description,
  available: product.availableForSale,
  storeUrl: product.onlineStoreUrl,
  // Products without real options have one option, "Title", with one value: nothing to choose.
  options: product.options
    .filter((option) => option.optionValues.length > 1)
    .map((option) => ({ name: option.name, values: option.optionValues.map(({ name }) => name) })),
  images: product.images.nodes.map((image) => imageOf(image)),
  variants: product.variants.nodes.map((variant) => ({
    id: variant.id,
    available: variant.availableForSale,
    price: priceOf(variant.price),
    options: variant.selectedOptions.map((selected) => ({
      name: selected.name,
      value: selected.value,
    })),
  })),
});

/** A product in a language, compared by value so the cache recognizes a repeated lookup. */
class ProductQuery extends Data.Class<{ readonly locale: Locale; readonly handle: string }> {}

const makeShopify = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;

  const domain = yield* Config.option(Config.String("SHOPIFY_STORE_DOMAIN"));
  const token = yield* Config.option(Config.Redacted("SHOPIFY_STOREFRONT_TOKEN"));

  const store = Option.all({ domain, token });

  /** One GraphQL request. Without the domain or the token it fails: that is a setup problem. */
  const graphQl = <S extends Schema.Constraint>(
    operation: string,
    query: string,
    variables: Readonly<Record<string, unknown>>,
    data: S,
  ): Effect.Effect<S["Type"], ShopifyError, S["DecodingServices"]> =>
    Option.match(store, {
      onNone: () =>
        Effect.fail(
          new ShopifyError({
            operation,
            cause: "SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_TOKEN is not set",
          }),
        ),
      onSome: ({ domain: shopDomain, token: shopToken }) =>
        client
          .execute(
            HttpClientRequest.post(`https://${shopDomain}/api/${API_VERSION}/graphql.json`).pipe(
              HttpClientRequest.setHeader(
                "X-Shopify-Storefront-Access-Token",
                Redacted.value(shopToken),
              ),
              HttpClientRequest.bodyJsonUnsafe({ query, variables }),
            ),
          )
          .pipe(
            Effect.flatMap(HttpClientResponse.filterStatusOk),
            Effect.flatMap(HttpClientResponse.schemaBodyJson(GraphQlResponse(data))),
            Effect.timeout(REQUEST_TIMEOUT),
            Effect.mapError(
              (error) => new ShopifyError({ operation, cause: describeHttpFailure(error) }),
            ),
            Effect.flatMap((response) => {
              const problems = response.errors ?? [];

              if (problems.length > 0 || response.data === undefined || response.data === null) {
                return Effect.fail(
                  new ShopifyError({
                    operation,
                    cause: problems.map((problem) => problem.message).join("; ") || "No data",
                  }),
                );
              }

              return Effect.succeed(response.data);
            }),
            // The HTTP client can record request headers in traces, and the token is one.
            Effect.provideService(HttpClient.TracerDisabledWhen, () => true),
            Effect.withSpan(`shopify.${operation}`),
          ),
    });

  const catalogs = yield* Cache.makeWith(
    (locale: Locale) =>
      graphQl("catalog", CATALOG_QUERY, { language: SHOPIFY_LANGUAGES[locale] }, CatalogData).pipe(
        Effect.map(catalogOf),
      ),
    { capacity: 10, timeToLive },
  );

  const products = yield* Cache.makeWith(
    (query: ProductQuery) =>
      graphQl(
        "product",
        PRODUCT_QUERY,
        { handle: query.handle, language: SHOPIFY_LANGUAGES[query.locale] },
        ProductData,
      ).pipe(Effect.map((data) => (data.product === null ? null : productOf(data.product)))),
    { capacity: 500, timeToLive },
  );

  const createCheckout = (lines: ReadonlyArray<CheckoutLine>) =>
    graphQl(
      "createCheckout",
      CHECKOUT_MUTATION,
      { lines: lines.map((line) => ({ merchandiseId: line.variantId, quantity: line.quantity })) },
      CheckoutData,
    ).pipe(
      Effect.flatMap((data): Effect.Effect<string, ShopifyError | ShopifyCheckoutRejected> => {
        const result = data.cartCreate;
        const rejection = result?.userErrors.at(0);

        if (rejection !== undefined) {
          return Effect.fail(new ShopifyCheckoutRejected({ reason: rejection.message }));
        }

        if (result?.cart === null || result?.cart === undefined) {
          return Effect.fail(new ShopifyError({ operation: "createCheckout", cause: "No cart" }));
        }

        return Effect.succeed(result.cart.checkoutUrl);
      }),
    );

  return Shopify.of({
    configured: Option.isSome(store),
    catalog: (locale) => Cache.get(catalogs, locale),
    product: (locale, handle) => Cache.get(products, new ProductQuery({ locale, handle })),
    createCheckout,
  });
});

/** A failed or unusable answer from Shopify, or a missing setting. */
export class ShopifyError extends Schema.TaggedError<ShopifyError>()("ShopifyError", {
  operation: Schema.String,
  /** A short description that never includes the token. */
  cause: Schema.String,
}) {}

/** Shopify refused to start a checkout, for example because the size sold out meanwhile. */
export class ShopifyCheckoutRejected extends Schema.TaggedError<ShopifyCheckoutRejected>()(
  "ShopifyCheckoutRejected",
  { reason: Schema.String },
) {}

/** The Necrotic Wear shop through Shopify's Storefront API: products, and checkouts for them. */
export class Shopify extends Context.Service<Shopify, ShopifyService>()("web/Shopify") {}

/**
 * The shop from `SHOPIFY_STORE_DOMAIN` and the public Storefront token in
 * `SHOPIFY_STOREFRONT_TOKEN`. Without them, every lookup fails with `ShopifyError` and the shop
 * page links to the shop's own site instead.
 */
export const ShopifyLive = Layer.effect(Shopify, makeShopify);

/** What the Shopify service offers. */
type ShopifyService = {
  readonly configured: boolean;
  readonly catalog: (locale: Locale) => Effect.Effect<ShopCatalog, ShopifyError>;
  readonly product: (
    locale: Locale,
    handle: string,
  ) => Effect.Effect<ShopProduct | null, ShopifyError>;
  readonly createCheckout: (
    lines: ReadonlyArray<CheckoutLine>,
  ) => Effect.Effect<string, ShopifyError | ShopifyCheckoutRejected>;
};

type CheckoutLine = {
  readonly variantId: string;
  readonly quantity: number;
};

/** An image on Shopify's image service, already scaled down. */
export type ShopImage = {
  readonly url: string;
  readonly alt: string | null;
  readonly width: number | null;
  readonly height: number | null;
};

/** A price and its currency. */
export type ShopPrice = {
  readonly amount: number;
  readonly currency: string;
};

/** A product as the shop grid shows it. `price` is the lowest price of its variants. */
export type ShopProductCard = {
  readonly handle: string;
  readonly title: string;
  readonly available: boolean;
  readonly price: ShopPrice;
  /** Whether some variants cost more than `price`, so the grid says "from". */
  readonly priceVaries: boolean;
  readonly image: ShopImage | null;
};

/** The shop page: every product, newest first, and the collections to filter them by. */
export type ShopCatalog = {
  readonly collections: ReadonlyArray<{
    readonly handle: string;
    readonly title: string;
    readonly productHandles: ReadonlyArray<string>;
  }>;
  readonly products: ReadonlyArray<ShopProductCard>;
};

/** A product page: its images, text, options to choose (such as size), and variants. */
export type ShopProduct = {
  readonly handle: string;
  readonly title: string;
  readonly description: string;
  readonly available: boolean;
  /** The product on the shop's own site; null when it is not published there. */
  readonly storeUrl: string | null;
  readonly options: ReadonlyArray<{
    readonly name: string;
    readonly values: ReadonlyArray<string>;
  }>;
  readonly images: ReadonlyArray<ShopImage>;
  readonly variants: ReadonlyArray<{
    readonly id: string;
    readonly available: boolean;
    readonly price: ShopPrice;
    readonly options: ReadonlyArray<{ readonly name: string; readonly value: string }>;
  }>;
};

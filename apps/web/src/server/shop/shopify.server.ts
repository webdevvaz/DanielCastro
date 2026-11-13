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

/** Thumbnail width of a cart line's photo. */
const CART_IMAGE_WIDTH = 300;

/** Everything the cart page shows. Line names follow the request's `@inContext` language. */
const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 100) {
    nodes {
      id
      quantity
      cost { totalAmount { amount currencyCode } amountPerQuantity { amount currencyCode } }
      merchandise {
        ... on ProductVariant {
          id
          availableForSale
          selectedOptions { name value }
          image { url(transform: { maxWidth: ${CART_IMAGE_WIDTH} }) altText width height }
          product {
            handle
            title
            featuredImage { url(transform: { maxWidth: ${CART_IMAGE_WIDTH} }) altText width height }
          }
        }
      }
    }
  }`;

const CART_QUERY = `
query Cart($cartId: ID!, $language: LanguageCode) @inContext(language: $language) {
  cart(id: $cartId) { ${CART_FIELDS} }
}`;

const CART_CREATE_MUTATION = `
mutation CartCreate($lines: [CartLineInput!]!, $language: LanguageCode) @inContext(language: $language) {
  cartCreate(input: { lines: $lines }) {
    cart { ${CART_FIELDS} }
    userErrors { message field }
    warnings { code }
  }
}`;

const CART_LINES_ADD_MUTATION = `
mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, $language: LanguageCode) @inContext(language: $language) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart { ${CART_FIELDS} }
    userErrors { message field }
    warnings { code }
  }
}`;

const CART_LINES_UPDATE_MUTATION = `
mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!, $language: LanguageCode) @inContext(language: $language) {
  cartLinesUpdate(cartId: $cartId, lines: $lines) {
    cart { ${CART_FIELDS} }
    userErrors { message field }
    warnings { code }
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

const CartFields = Schema.Struct({
  id: Schema.String,
  checkoutUrl: CheckoutUrl,
  totalQuantity: Schema.Int,
  cost: Schema.Struct({ subtotalAmount: Money }),
  lines: Schema.Struct({
    nodes: Schema.Array(
      Schema.Struct({
        id: Schema.String,
        quantity: Schema.Int,
        cost: Schema.Struct({ totalAmount: Money, amountPerQuantity: Money }),
        merchandise: Schema.Struct({
          id: Schema.String,
          availableForSale: Schema.Boolean,
          selectedOptions: Schema.Array(
            Schema.Struct({ name: Schema.String, value: Schema.String }),
          ),
          image: Schema.NullOr(Image),
          product: Schema.Struct({
            handle: Schema.String,
            title: Schema.String,
            featuredImage: Schema.NullOr(Image),
          }),
        }),
      }),
    ),
  }),
});

const CartData = Schema.Struct({ cart: Schema.NullOr(CartFields) });

/**
 * The answer of a cart mutation. `field` names the input a problem is about, such as `cartId`.
 * Warnings come with a cart that changed anyway, for example with fewer items than asked.
 */
const CartPayload = Schema.NullOr(
  Schema.Struct({
    cart: Schema.NullOr(CartFields),
    userErrors: Schema.Array(
      Schema.Struct({
        message: Schema.String,
        field: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
      }),
    ),
    warnings: Schema.optional(Schema.Array(Schema.Struct({ code: Schema.String }))),
  }),
);

const CartCreateData = Schema.Struct({ cartCreate: CartPayload });

const CartLinesAddData = Schema.Struct({ cartLinesAdd: CartPayload });

const CartLinesUpdateData = Schema.Struct({ cartLinesUpdate: CartPayload });

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
 * A cart as the site shows it. Products without real options have one option, "Title" with the
 * value "Default Title", which is left out. A line shows the variant's photo, or the product's.
 */
const cartOf = (cart: typeof CartFields.Type): ShopCart => ({
  id: cart.id,
  checkoutUrl: cart.checkoutUrl,
  totalQuantity: cart.totalQuantity,
  subtotal: priceOf(cart.cost.subtotalAmount),
  lines: cart.lines.nodes.map((line) => {
    const image = line.merchandise.image ?? line.merchandise.product.featuredImage;

    return {
      id: line.id,
      quantity: line.quantity,
      variantId: line.merchandise.id,
      available: line.merchandise.availableForSale,
      productHandle: line.merchandise.product.handle,
      productTitle: line.merchandise.product.title,
      options: line.merchandise.selectedOptions.filter(
        (option) => option.value !== "Default Title",
      ),
      image: image === null ? null : imageOf(image),
      unitPrice: priceOf(line.cost.amountPerQuantity),
      total: priceOf(line.cost.totalAmount),
    };
  }),
});

/** A line in the shape Shopify's cart input takes. */
const lineInput = (line: CheckoutLine) => ({
  merchandiseId: line.variantId,
  quantity: line.quantity,
});

/** Warnings for a cart that holds fewer items than asked, because of stock. */
const STOCK_WARNINGS: ReadonlySet<string> = new Set([
  "MERCHANDISE_NOT_ENOUGH_STOCK",
  "MERCHANDISE_OUT_OF_STOCK",
]);

/** Whether Shopify refused a cart mutation because the cart no longer exists. */
const isMissingCart = (problem: { readonly field?: ReadonlyArray<string> | null | undefined }) =>
  problem.field?.at(0) === "cartId";

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

/**
 * The cart a mutation answers with, and whether Shopify took fewer items than asked because of
 * stock. A cart that no longer exists is null; any other refusal, such as a size that sold out,
 * fails with `ShopifyCartRejected`.
 */
const cartFromPayload = (
  operation: string,
  payload: typeof CartPayload.Type,
): Effect.Effect<ShopCartChange | null, ShopifyError | ShopifyCartRejected> => {
  const problems = payload?.userErrors ?? [];

  if (problems.some(isMissingCart)) return Effect.succeed(null);

  const rejection = problems.at(0);

  if (rejection !== undefined) {
    return Effect.fail(new ShopifyCartRejected({ reason: rejection.message }));
  }

  if (payload?.cart === null || payload?.cart === undefined) {
    return Effect.fail(new ShopifyError({ operation, cause: "No cart" }));
  }

  const limitedByStock = (payload.warnings ?? []).some(({ code }) => STOCK_WARNINGS.has(code));

  return Effect.succeed({ cart: cartOf(payload.cart), limitedByStock });
};

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
      { lines: lines.map(lineInput) },
      CheckoutData,
    ).pipe(
      Effect.flatMap((data): Effect.Effect<string, ShopifyError | ShopifyCartRejected> => {
        const result = data.cartCreate;
        const rejection = result?.userErrors.at(0);

        if (rejection !== undefined) {
          return Effect.fail(new ShopifyCartRejected({ reason: rejection.message }));
        }

        if (result?.cart === null || result?.cart === undefined) {
          return Effect.fail(new ShopifyError({ operation: "createCheckout", cause: "No cart" }));
        }

        return Effect.succeed(result.cart.checkoutUrl);
      }),
    );

  const cart = (locale: Locale, cartId: string) =>
    graphQl("cart", CART_QUERY, { cartId, language: SHOPIFY_LANGUAGES[locale] }, CartData).pipe(
      Effect.map((data) => (data.cart === null ? null : cartOf(data.cart))),
    );

  const createCart = (locale: Locale, lines: ReadonlyArray<CheckoutLine>) =>
    graphQl(
      "createCart",
      CART_CREATE_MUTATION,
      { lines: lines.map(lineInput), language: SHOPIFY_LANGUAGES[locale] },
      CartCreateData,
    ).pipe(
      Effect.flatMap((data) => cartFromPayload("createCart", data.cartCreate)),
      Effect.flatMap((created) =>
        created === null
          ? Effect.fail(new ShopifyError({ operation: "createCart", cause: "No cart" }))
          : Effect.succeed(created),
      ),
    );

  const addCartLines = (locale: Locale, cartId: string, lines: ReadonlyArray<CheckoutLine>) =>
    graphQl(
      "addCartLines",
      CART_LINES_ADD_MUTATION,
      { cartId, lines: lines.map(lineInput), language: SHOPIFY_LANGUAGES[locale] },
      CartLinesAddData,
    ).pipe(Effect.flatMap((data) => cartFromPayload("addCartLines", data.cartLinesAdd)));

  const updateCartLines = (locale: Locale, cartId: string, lines: ReadonlyArray<CartLineChange>) =>
    graphQl(
      "updateCartLines",
      CART_LINES_UPDATE_MUTATION,
      {
        cartId,
        lines: lines.map((line) => ({ id: line.lineId, quantity: line.quantity })),
        language: SHOPIFY_LANGUAGES[locale],
      },
      CartLinesUpdateData,
    ).pipe(Effect.flatMap((data) => cartFromPayload("updateCartLines", data.cartLinesUpdate)));

  return Shopify.of({
    configured: Option.isSome(store),
    catalog: (locale) => Cache.get(catalogs, locale),
    product: (locale, handle) => Cache.get(products, new ProductQuery({ locale, handle })),
    createCheckout,
    cart,
    createCart,
    addCartLines,
    updateCartLines,
  });
});

/** A failed or unusable answer from Shopify, or a missing setting. */
export class ShopifyError extends Schema.TaggedError<ShopifyError>()("ShopifyError", {
  operation: Schema.String,
  /** A short description that never includes the token. */
  cause: Schema.String,
}) {}

/**
 * Shopify refused a checkout or a change to a cart, for example because the size sold out
 * meanwhile.
 */
export class ShopifyCartRejected extends Schema.TaggedError<ShopifyCartRejected>()(
  "ShopifyCartRejected",
  { reason: Schema.String },
) {}

/** The Necrotic Wear shop through Shopify's Storefront API: products, carts, and checkouts. */
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
  ) => Effect.Effect<string, ShopifyError | ShopifyCartRejected>;
  /** A cart with names in a language, or null when it no longer exists (ordered or expired). */
  readonly cart: (locale: Locale, cartId: string) => Effect.Effect<ShopCart | null, ShopifyError>;
  readonly createCart: (
    locale: Locale,
    lines: ReadonlyArray<CheckoutLine>,
  ) => Effect.Effect<ShopCartChange, ShopifyError | ShopifyCartRejected>;
  /** Adds lines; null when the cart no longer exists. */
  readonly addCartLines: (
    locale: Locale,
    cartId: string,
    lines: ReadonlyArray<CheckoutLine>,
  ) => Effect.Effect<ShopCartChange | null, ShopifyError | ShopifyCartRejected>;
  /** Sets line quantities, where 0 removes a line; null when the cart no longer exists. */
  readonly updateCartLines: (
    locale: Locale,
    cartId: string,
    lines: ReadonlyArray<CartLineChange>,
  ) => Effect.Effect<ShopCartChange | null, ShopifyError | ShopifyCartRejected>;
};

type CheckoutLine = {
  readonly variantId: string;
  readonly quantity: number;
};

type CartLineChange = {
  readonly lineId: string;
  readonly quantity: number;
};

/** A visitor's cart on Shopify. `checkoutUrl` pays for every line at once. */
export type ShopCart = {
  readonly id: string;
  readonly checkoutUrl: string;
  readonly totalQuantity: number;
  readonly subtotal: ShopPrice;
  readonly lines: ReadonlyArray<ShopCartLine>;
};

/** A cart after a change, and whether Shopify took fewer items than asked because of stock. */
export type ShopCartChange = {
  readonly cart: ShopCart;
  readonly limitedByStock: boolean;
};

/** One product variant in a cart, and how many. */
export type ShopCartLine = {
  readonly id: string;
  readonly quantity: number;
  readonly variantId: string;
  readonly available: boolean;
  readonly productHandle: string;
  readonly productTitle: string;
  readonly options: ReadonlyArray<{ readonly name: string; readonly value: string }>;
  readonly image: ShopImage | null;
  readonly unitPrice: ShopPrice;
  readonly total: ShopPrice;
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

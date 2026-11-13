import { Schema } from "effect";

import { SiteLocale } from "./locales";

/** Most items of one product a visitor can buy in one checkout from the site. */
export const SHOP_MAX_QUANTITY = 5;

/**
 * A product's handle, the last part of its address on the shop (`dark-virgo`). It is part of a
 * GraphQL variable, never of the query text, but only handles of this shape can exist.
 */
export const ShopProductHandle = Schema.String.check(
  Schema.isMaxLength(200),
  Schema.isPattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
);

/** A product variant (one size of one product), as Shopify names it. */
export const ShopVariantId = Schema.String.check(
  Schema.isPattern(/^gid:\/\/shopify\/ProductVariant\/\d+$/),
);

/** The shop page's products and collections, in a site language. */
export const ShopCatalogInput = Schema.Struct({
  locale: SiteLocale,
});

/** One product's page, in a site language. */
export const ShopProductInput = Schema.Struct({
  locale: SiteLocale,
  handle: ShopProductHandle,
});

/** "Buy now": one variant and how many, which go to a new Shopify checkout. */
export const ShopCheckoutInput = Schema.Struct({
  variantId: ShopVariantId,
  quantity: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: SHOP_MAX_QUANTITY })),
});

/** Decoded "Buy now" input. */
export type ShopCheckoutInput = typeof ShopCheckoutInput.Type;

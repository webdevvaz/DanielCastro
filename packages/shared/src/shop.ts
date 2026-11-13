import { Schema } from "effect";

import { SiteLocale } from "./locales";

/** Most items of one product a visitor can buy now or add to the cart at once. */
export const SHOP_MAX_QUANTITY = 5;

/** Most items one line of the cart can hold, after several additions. */
export const SHOP_MAX_LINE_QUANTITY = 20;

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

/**
 * A cart, as Shopify names it: `gid://shopify/Cart/<token>?key=<key>`. The browser keeps it in a
 * cookie, so it is visitor input: only IDs of this shape reach Shopify.
 */
export const ShopCartId = Schema.String.check(
  Schema.isMaxLength(300),
  Schema.isPattern(/^gid:\/\/shopify\/Cart\/[A-Za-z0-9_-]+(?:\?key=[A-Za-z0-9]+)?$/),
);

/** One line of a cart: `gid://shopify/CartLine/<id>?cart=<token>`. */
export const ShopCartLineId = Schema.String.check(
  Schema.isMaxLength(300),
  Schema.isPattern(/^gid:\/\/shopify\/CartLine\/[A-Za-z0-9-]+(?:\?cart=[A-Za-z0-9_-]+)?$/),
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

/** The visitor's cart, with product names in a site language. */
export const ShopCartInput = Schema.Struct({
  locale: SiteLocale,
});

/** "Add to cart": one variant and how many. */
export const AddToShopCartInput = Schema.Struct({
  locale: SiteLocale,
  variantId: ShopVariantId,
  quantity: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: SHOP_MAX_QUANTITY })),
});

/** A new quantity for one line of the cart; 0 removes the line. */
export const UpdateShopCartLineInput = Schema.Struct({
  locale: SiteLocale,
  lineId: ShopCartLineId,
  quantity: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: SHOP_MAX_LINE_QUANTITY })),
});

/** Decoded "Buy now" input. */
export type ShopCheckoutInput = typeof ShopCheckoutInput.Type;

/** Decoded "Add to cart" input. */
export type AddToShopCartInput = typeof AddToShopCartInput.Type;

/** Decoded change to a cart line. */
export type UpdateShopCartLineInput = typeof UpdateShopCartLineInput.Type;

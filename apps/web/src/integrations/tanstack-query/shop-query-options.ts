import type { Locale } from "@daniel/shared/locales";

import { queryOptions } from "@tanstack/react-query";

import { getCart, getShop, getShopItem } from "@/server/shop/shop.functions";

/** Products change rarely, and the server keeps them for 10 minutes too. */
const SHOP_STALE_TIME = 5 * 60_000;

/** The cart changes only through this browser's own updates, which write the cache directly. */
const CART_STALE_TIME = 60_000;

/** Query keys for shop data. */
export const shopQueryKeys = {
  all: ["shop"] as const,
  catalog: (locale: Locale) => ["shop", "catalog", locale] as const,
  product: (locale: Locale, handle: string) => ["shop", "product", locale, handle] as const,
  carts: ["shop", "cart"] as const,
  cart: (locale: Locale) => ["shop", "cart", locale] as const,
};

/**
 * The visitor's cart, with names in a language. Pages other than the cart page do not load it on
 * the server, so their first render matches the browser's: the cart count appears just after.
 */
export const shopCartQueryOptions = (locale: Locale) =>
  queryOptions({
    queryKey: shopQueryKeys.cart(locale),
    queryFn: () => getCart({ data: { locale } }),
    staleTime: CART_STALE_TIME,
  });

/** The shop page's products and collections in a language. */
export const shopCatalogQueryOptions = (locale: Locale) =>
  queryOptions({
    queryKey: shopQueryKeys.catalog(locale),
    queryFn: () => getShop({ data: { locale } }),
    staleTime: SHOP_STALE_TIME,
  });

/** One product's page in a language. */
export const shopProductQueryOptions = (locale: Locale, handle: string) =>
  queryOptions({
    queryKey: shopQueryKeys.product(locale, handle),
    queryFn: () => getShopItem({ data: { locale, handle } }),
    staleTime: SHOP_STALE_TIME,
  });

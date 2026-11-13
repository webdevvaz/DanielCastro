import { ShopCatalogInput, ShopCheckoutInput, ShopProductInput } from "@daniel/shared/shop";
import { createServerFn } from "@tanstack/react-start";

import { runServerEffect } from "../run.server";
import { validateInput } from "../validate-input";
import { getShopCatalog, getShopProduct, startShopCheckout } from "./shop.server";

/** The shop page's products and collections in a site language. Public. */
export const getShop = createServerFn({ method: "GET" })
  .validator(validateInput(ShopCatalogInput))
  .handler(({ data }) => runServerEffect(getShopCatalog(data.locale)));

/** One product's page in a site language. Public. */
export const getShopItem = createServerFn({ method: "GET" })
  .validator(validateInput(ShopProductInput))
  .handler(({ data }) => runServerEffect(getShopProduct(data.locale, data.handle)));

/**
 * "Buy now": starts a Shopify checkout for one variant and returns its address. Public: anyone
 * may start a checkout, and Shopify takes the payment, so the site stores nothing.
 */
export const buyShopItem = createServerFn({ method: "POST" })
  .validator(validateInput(ShopCheckoutInput))
  .handler(({ data }) => runServerEffect(startShopCheckout(data)));

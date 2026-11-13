import {
  AddToShopCartInput,
  ShopCartInput,
  ShopCatalogInput,
  ShopCheckoutInput,
  ShopProductInput,
  UpdateShopCartLineInput,
} from "@daniel/shared/shop";
import { createServerFn } from "@tanstack/react-start";

import { runServerEffect } from "../run.server";
import { validateInput } from "../validate-input";
import {
  addToShopCart,
  getShopCart,
  getShopCatalog,
  getShopProduct,
  startShopCheckout,
  updateShopCartLine,
} from "./shop.server";

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

/**
 * The visitor's cart, from the cart cookie. Public: a cart belongs to whoever holds its ID, and
 * the site stores nothing about it.
 */
export const getCart = createServerFn({ method: "GET" })
  .validator(validateInput(ShopCartInput))
  .handler(({ data }) => runServerEffect(getShopCart(data.locale)));

/** "Add to cart". Returns the cart, whose ID the browser keeps in the cart cookie. Public. */
export const addToCart = createServerFn({ method: "POST" })
  .validator(validateInput(AddToShopCartInput))
  .handler(({ data }) => runServerEffect(addToShopCart(data)));

/** Changes how many of a line the cart holds; 0 removes it. Public. */
export const updateCartLine = createServerFn({ method: "POST" })
  .validator(validateInput(UpdateShopCartLineInput))
  .handler(({ data }) => runServerEffect(updateShopCartLine(data)));

/** The cookie that keeps a visitor's cart: the Shopify cart ID, URL-encoded. */
export const SHOP_CART_COOKIE = "shop_cart";

/** A month. Shopify forgets an abandoned cart sooner; the site then starts a new one. */
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Keeps the cart's ID in the browser, so the next request finds the same cart. */
export const rememberCart = (cartId: string) => {
  document.cookie = `${SHOP_CART_COOKIE}=${encodeURIComponent(cartId)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

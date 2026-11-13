import type { QueryClient } from "@tanstack/react-query";

import type { shopCartQueryOptions } from "@/integrations/tanstack-query/shop-query-options";
import type { ShopCart } from "@/server/shop/shopify.server";

import { shopQueryKeys } from "@/integrations/tanstack-query/shop-query-options";

import { rememberCart } from "./cart-cookie";

/**
 * Keeps a cart that a change returned: its ID in the cart cookie, and the cart in the query cache
 * for the page's language, so the cart page and the menu count update at once. The cart in the
 * other languages is marked stale and loads again when shown.
 */
export const storeCart = (
  queryClient: QueryClient,
  options: ReturnType<typeof shopCartQueryOptions>,
  cart: ShopCart | null,
) => {
  if (cart !== null) rememberCart(cart.id);

  void queryClient.invalidateQueries({ queryKey: shopQueryKeys.carts, refetchType: "none" });

  queryClient.setQueryData(options.queryKey, { status: "ready", cart });
};

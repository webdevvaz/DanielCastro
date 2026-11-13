import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PagePending } from "@/components/page-skeleton";
import { localeFromParam } from "@/i18n/locales";
import { pageTitleFor } from "@/i18n/site-messages";
import { CartPage } from "@/shop/cart-page";

/**
 * The visitor's cart. The loader waits for it, so the server renders the cart and sends it with
 * the page; the menu's cart count then matches on the first draw too.
 */
export const Route = createFileRoute("/{-$locale}/_site/shop/cart")({
  loader: async ({ context, params }) => {
    await context.queryClient
      .query(context.shopCartQueryOptions(localeFromParam(params.locale)))
      .catch(noop);
  },
  head: ({ params }) => ({
    meta: [{ title: pageTitleFor(params.locale, "cart") }, { name: "robots", content: "noindex" }],
  }),
  pendingComponent: PagePending,
  component: CartPage,
});

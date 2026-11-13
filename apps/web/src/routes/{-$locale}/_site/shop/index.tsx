import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PagePending } from "@/components/page-skeleton";
import { localeFromParam } from "@/i18n/locales";
import { pageTitleFor } from "@/i18n/site-messages";
import { shopCatalogQueryOptions } from "@/integrations/tanstack-query/shop-query-options";
import { ShopPage } from "@/shop/shop-page";

/** The Shop: Necrotic Wear's products, from Shopify. */
export const Route = createFileRoute("/{-$locale}/_site/shop/")({
  context: () => ({ shopCatalogQueryOptions }),
  loader: ({ context, params }) => {
    void context.queryClient
      .query(context.shopCatalogQueryOptions(localeFromParam(params.locale)))
      .catch(noop);
  },
  head: ({ params }) => ({ meta: [{ title: pageTitleFor(params.locale, "shop") }] }),
  pendingComponent: PagePending,
  component: ShopPage,
});

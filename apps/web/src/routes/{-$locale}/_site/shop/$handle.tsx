import { NotFoundError } from "@daniel/shared/errors";
import { ShopProductHandle } from "@daniel/shared/shop";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Option, Schema } from "effect";

import { PagePending } from "@/components/page-skeleton";
import { localeFromParam } from "@/i18n/locales";
import { pageTitleFor } from "@/i18n/site-messages";
import { shopProductQueryOptions } from "@/integrations/tanstack-query/shop-query-options";
import { ProductPage } from "@/shop/product-page";

const decodeHandle = Schema.decodeUnknownOption(ShopProductHandle);

/**
 * One product of the Shop. The loader waits for the product, because an unknown handle must
 * answer 404 instead of an empty page.
 */
export const Route = createFileRoute("/{-$locale}/_site/shop/$handle")({
  params: {
    parse: (raw) => {
      const handle = decodeHandle(raw.handle);

      if (Option.isNone(handle)) throw notFound();

      return { handle: handle.value };
    },
  },
  context: () => ({ shopProductQueryOptions }),
  loader: async ({ context, params }) => {
    const options = context.shopProductQueryOptions(localeFromParam(params.locale), params.handle);

    const product = await context.queryClient.query(options).catch((error: unknown) => {
      if (error instanceof NotFoundError) throw notFound();

      throw error;
    });

    return { title: product.title };
  },
  head: ({ params, loaderData }) => ({
    meta: [
      {
        title:
          loaderData === undefined
            ? pageTitleFor(params.locale, "shop")
            : `${loaderData.title} — Daniel Castro`,
      },
    ],
  }),
  pendingComponent: PagePending,
  component: ProductPage,
});

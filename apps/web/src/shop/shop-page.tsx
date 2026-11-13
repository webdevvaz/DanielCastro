import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";

import type { ShopProductCard } from "@/server/shop/shopify.server";

import { appConfig } from "@/app-config";
import { localeParam, type Locale } from "@/i18n/locales";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { CartLink } from "./cart-link";
import { formatShopPrice } from "./shop-money";
import { SHOP_TEXT } from "./shop-text";

/** One product in the grid: its photo, name, and price, linking to its page. */
function ProductTile({ product, locale }: { product: ShopProductCard; locale: Locale }) {
  const t = SHOP_TEXT[locale];

  const price = formatShopPrice(product.price, locale);

  return (
    <li className="shop-tile" data-sold-out={!product.available}>
      <Link
        to="/{-$locale}/shop/$handle"
        params={{ locale: localeParam(locale), handle: product.handle }}
      >
        <span className="shop-tile-image">
          {product.image === null ? null : (
            <img
              src={product.image.url}
              alt={product.image.alt ?? product.title}
              width={product.image.width ?? undefined}
              height={product.image.height ?? undefined}
              loading="lazy"
              decoding="async"
            />
          )}
          {product.available ? null : <span className="shop-badge">{t.soldOut}</span>}
        </span>
        <span className="shop-tile-name">{product.title}</span>
        <span className="shop-tile-price">{product.priceVaries ? t.from(price) : price}</span>
      </Link>
    </li>
  );
}

/**
 * The Shop page: Necrotic Wear's products from Shopify, newest first, with a filter per
 * collection. When the shop cannot load, it links to the shop's own site.
 */
export function ShopPage() {
  const context = useRouteContext({ from: "/{-$locale}/_site/shop/" });
  const locale = useLocale();
  const site = useSiteMessages();
  const t = SHOP_TEXT[locale];

  const [collectionHandle, setCollectionHandle] = useState<string | null>(null);

  const { data: view } = useSuspenseQuery(context.shopCatalogQueryOptions(locale));

  const collection = view.catalog?.collections.find(({ handle }) => handle === collectionHandle);
  const shown = (view.catalog?.products ?? []).filter(
    (product) => collection === undefined || collection.productHandles.includes(product.handle),
  );

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>{site.nav.shop}</b> {t.eyebrowDetail}
            </p>
            <h1>
              {t.headingFirst} <em>{t.headingSecond}</em>
            </h1>
          </div>
          <div className="shop-head-side">
            <p className="lead">{t.lead}</p>
            <CartLink />
          </div>
        </div>

        {view.catalog === null ? (
          <p className="empty-state">
            {t.unavailable}{" "}
            <a href={appConfig.links.shop} target="_blank" rel="noreferrer">
              {t.visitStore}
            </a>
          </p>
        ) : (
          <>
            {view.catalog.collections.length === 0 ? null : (
              <div className="shop-filters" role="group" aria-label={t.filterLabel}>
                <button
                  type="button"
                  aria-pressed={collectionHandle === null}
                  onClick={() => setCollectionHandle(null)}
                >
                  {t.all}
                </button>
                {view.catalog.collections.map((item) => (
                  <button
                    key={item.handle}
                    type="button"
                    aria-pressed={collectionHandle === item.handle}
                    onClick={() => setCollectionHandle(item.handle)}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            )}
            {shown.length === 0 ? (
              <p className="empty-state">{t.empty}</p>
            ) : (
              <ul className="shop-grid">
                {shown.map((product) => (
                  <ProductTile key={product.handle} product={product} locale={locale} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}

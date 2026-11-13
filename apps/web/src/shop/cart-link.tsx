import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";

import { localeParam } from "@/i18n/locales";
import { useLocale } from "@/i18n/use-locale";

import { SHOP_TEXT } from "./shop-text";

/** "Cart (2)", linking to the cart page, while the cart holds something. */
export function CartLink() {
  const context = useRouteContext({ from: "/{-$locale}/_site" });
  const locale = useLocale();
  const t = SHOP_TEXT[locale];

  const { data: cartView } = useQuery(context.shopCartQueryOptions(locale));

  const count = cartView?.cart?.totalQuantity ?? 0;

  if (count === 0) return null;

  return (
    <Link
      className="btn btn-ghost btn-small"
      to="/{-$locale}/shop/cart"
      params={{ locale: localeParam(locale) }}
    >
      {t.viewCart(count)}
    </Link>
  );
}

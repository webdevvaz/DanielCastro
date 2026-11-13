import { ConflictError } from "@daniel/shared/errors";
import { SHOP_MAX_LINE_QUANTITY } from "@daniel/shared/shop";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import type { ShopCartLine } from "@/server/shop/shopify.server";

import { localeParam } from "@/i18n/locales";
import { useLocale } from "@/i18n/use-locale";
import { updateCartLine } from "@/server/shop/shop.functions";

import { formatShopPrice } from "./shop-money";
import { SHOP_TEXT } from "./shop-text";
import { storeCart } from "./store-cart";

/** "Size: M", or nothing for a product without options. */
const optionsText = (line: ShopCartLine) =>
  line.options.map((option) => `${option.name}: ${option.value}`).join(" · ");

/**
 * The cart: each line with its photo, options, price, and quantity, which the visitor can change
 * or remove, then one checkout on Shopify for everything. One change runs at a time, so the cart
 * on screen always matches the last answer from Shopify.
 */
export function CartPage() {
  const context = useRouteContext({ from: "/{-$locale}/_site/shop/cart" });
  const locale = useLocale();
  const t = SHOP_TEXT[locale];

  const [problem, setProblem] = useState<string | null>(null);

  const update = useServerFn(updateCartLine);

  const cartOptions = context.shopCartQueryOptions(locale);

  const { data: view } = useSuspenseQuery(cartOptions);

  const change = useMutation({
    mutationFn: (next: { readonly lineId: string; readonly quantity: number }) =>
      update({ data: { locale, ...next } }),
    onMutate: () => setProblem(null),
    onSuccess: (change) => {
      storeCart(context.queryClient, cartOptions, change?.cart ?? null);

      if (change?.limitedByStock === true) setProblem(t.notEnoughStock);
    },
    onError: (error) => setProblem(error instanceof ConflictError ? t.soldOutNow : t.cartFailed),
  });

  const cart = view.cart;
  const shopParams = { locale: localeParam(locale) };

  return (
    <main className="page">
      <div className="wrap">
        <p className="eyebrow">
          <Link to="/{-$locale}/shop" params={shopParams}>
            ← {t.continueShopping}
          </Link>
        </p>
        <h1>
          {t.cartHeadingFirst} <em>{t.cartHeadingSecond}</em>
        </h1>

        {view.status === "unavailable" ? <p className="empty-state">{t.cartUnavailable}</p> : null}

        {view.status === "ready" && (cart === null || cart.lines.length === 0) ? (
          <p className="empty-state">
            {t.cartEmpty}{" "}
            <Link to="/{-$locale}/shop" params={shopParams}>
              {t.continueShopping}
            </Link>
          </p>
        ) : null}

        {cart === null || cart.lines.length === 0 ? null : (
          <div className="cart">
            <ul className="cart-lines" aria-busy={change.isPending}>
              {cart.lines.map((line) => (
                <li className="cart-line" key={line.id}>
                  <Link
                    className="cart-line-image"
                    to="/{-$locale}/shop/$handle"
                    params={{ ...shopParams, handle: line.productHandle }}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {line.image === null ? null : (
                      <img
                        src={line.image.url}
                        alt=""
                        width={line.image.width ?? undefined}
                        height={line.image.height ?? undefined}
                        loading="lazy"
                      />
                    )}
                  </Link>
                  <div className="cart-line-text">
                    <Link
                      to="/{-$locale}/shop/$handle"
                      params={{ ...shopParams, handle: line.productHandle }}
                    >
                      {line.productTitle}
                    </Link>
                    {line.options.length === 0 ? null : (
                      <span className="muted">{optionsText(line)}</span>
                    )}
                    <span className="muted">{formatShopPrice(line.unitPrice, locale)}</span>
                    {line.available ? null : <span className="shop-badge">{t.soldOut}</span>}
                  </div>
                  <div className="cart-line-quantity" role="group" aria-label={t.quantity}>
                    <button
                      type="button"
                      aria-label={t.fewer(line.productTitle)}
                      disabled={change.isPending || line.quantity <= 1}
                      onClick={() =>
                        change.mutate({ lineId: line.id, quantity: line.quantity - 1 })
                      }
                    >
                      −
                    </button>
                    <span aria-live="polite">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label={t.more(line.productTitle)}
                      disabled={change.isPending || line.quantity >= SHOP_MAX_LINE_QUANTITY}
                      onClick={() =>
                        change.mutate({ lineId: line.id, quantity: line.quantity + 1 })
                      }
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-line-end">
                    <strong>{formatShopPrice(line.total, locale)}</strong>
                    <button
                      className="cart-line-remove"
                      type="button"
                      aria-label={t.remove(line.productTitle)}
                      disabled={change.isPending}
                      onClick={() => change.mutate({ lineId: line.id, quantity: 0 })}
                    >
                      {t.removeShort}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-summary panel">
              <p className="cart-subtotal">
                <span>{t.subtotal}</span>
                <strong>{formatShopPrice(cart.subtotal, locale)}</strong>
              </p>
              <p className="field-hint">{t.shippingNote}</p>
              {problem === null ? null : (
                <p className="form-error" role="alert">
                  {problem}
                </p>
              )}
              <a
                className="btn btn-red"
                href={cart.checkoutUrl}
                aria-disabled={change.isPending}
                onClick={(event) => {
                  if (change.isPending) event.preventDefault();
                }}
              >
                {t.checkout}
              </a>
              <p className="field-hint">{t.checkoutNote}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

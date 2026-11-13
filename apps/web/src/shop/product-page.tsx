import { ConflictError } from "@daniel/shared/errors";
import { SHOP_MAX_QUANTITY } from "@daniel/shared/shop";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import type { ShopProduct } from "@/server/shop/shopify.server";

import { localeParam } from "@/i18n/locales";
import { useLocale } from "@/i18n/use-locale";
import { addToCart, buyShopItem } from "@/server/shop/shop.functions";

import { CartLink } from "./cart-link";
import { formatShopPrice } from "./shop-money";
import { SHOP_TEXT } from "./shop-text";
import { storeCart } from "./store-cart";

/** Option names that mean "size" in the languages the shop may use. */
const SIZE_OPTION_NAMES = new Set(["size", "tamanho", "taille", "größe", "talla"]);

const QUANTITIES = Array.from({ length: SHOP_MAX_QUANTITY }, (_, index) => index + 1);

const isSizeOption = (name: string) => SIZE_OPTION_NAMES.has(name.toLowerCase());

/**
 * Whether a value of an option can still be bought, given the values already chosen for the other
 * options: some variant with that value and those choices is in stock.
 */
const valueInStock = (
  product: ShopProduct,
  chosen: Readonly<Record<string, string>>,
  optionName: string,
  value: string,
) =>
  product.variants.some(
    (variant) =>
      variant.available &&
      variant.options.every((option) =>
        option.name === optionName
          ? option.value === value
          : chosen[option.name] === undefined || chosen[option.name] === option.value,
      ),
  );

/** The variant that matches every chosen option, or undefined while a choice is missing. */
const chosenVariant = (product: ShopProduct, chosen: Readonly<Record<string, string>>) =>
  product.variants.find((variant) =>
    product.options.every((option) =>
      variant.options.some(
        (selected) => selected.name === option.name && selected.value === chosen[option.name],
      ),
    ),
  );

/**
 * A product's page: its photos, text, price, options such as size, "Add to cart", and "Buy now",
 * which opens Shopify's checkout for the chosen variant alone. Sizes that are sold out cannot be
 * chosen.
 */
export function ProductPage() {
  const context = useRouteContext({ from: "/{-$locale}/_site/shop/$handle" });
  const { handle } = useParams({ from: "/{-$locale}/_site/shop/$handle" });
  const locale = useLocale();
  const t = SHOP_TEXT[locale];

  const [imageIndex, setImageIndex] = useState(0);
  const [chosen, setChosen] = useState<Readonly<Record<string, string>>>({});
  const [quantity, setQuantity] = useState(1);
  const [problem, setProblem] = useState<string | null>(null);

  const buy = useServerFn(buyShopItem);
  const add = useServerFn(addToCart);

  const { data: product } = useSuspenseQuery(context.shopProductQueryOptions(locale, handle));

  const checkout = useMutation({
    mutationFn: (variantId: string) => buy({ data: { variantId, quantity } }),
    onSuccess: ({ checkoutUrl }) => {
      window.location.assign(checkoutUrl);
    },
    onError: (error) => {
      setProblem(error instanceof ConflictError ? t.soldOutNow : t.checkoutFailed);
    },
  });

  const addition = useMutation({
    mutationFn: (variantId: string) => add({ data: { locale, variantId, quantity } }),
    onSuccess: (change) => {
      storeCart(context.queryClient, context.shopCartQueryOptions(locale), change.cart);

      if (change.limitedByStock) setProblem(t.notEnoughStock);
    },
    onError: (error) => {
      setProblem(error instanceof ConflictError ? t.soldOutNow : t.cartFailed);
    },
  });

  const variant = chosenVariant(product, chosen);
  const image = product.images.at(imageIndex);
  const lowest = Math.min(...product.variants.map(({ price }) => price.amount));
  const currency = product.variants.at(0)?.price.currency ?? "EUR";
  const price = variant?.price ?? { amount: lowest, currency };
  const busy = checkout.isPending || checkout.isSuccess || addition.isPending;

  /** Runs an action for the chosen variant, or asks for the missing choice. */
  const withVariant = (action: (variantId: string) => void) => () => {
    setProblem(null);

    if (variant === undefined) {
      setProblem(
        product.options.some(({ name }) => isSizeOption(name)) ? t.chooseSize : t.chooseOption,
      );

      return;
    }

    action(variant.id);
  };

  return (
    <main className="page">
      <div className="wrap">
        <div className="shop-product-bar">
          <p className="eyebrow">
            <Link to="/{-$locale}/shop" params={{ locale: localeParam(locale) }}>
              ← {t.backToShop}
            </Link>
          </p>
          <CartLink />
        </div>

        <div className="shop-product">
          <div className="shop-gallery">
            {image === undefined ? null : (
              <img
                className="shop-gallery-main"
                src={image.url}
                alt={image.alt ?? t.photoOf(product.title, imageIndex + 1)}
                width={image.width ?? undefined}
                height={image.height ?? undefined}
              />
            )}
            {product.images.length > 1 ? (
              <div className="shop-gallery-thumbs">
                {product.images.map((thumb, index) => (
                  <button
                    key={thumb.url}
                    type="button"
                    aria-pressed={index === imageIndex}
                    aria-label={t.photoOf(product.title, index + 1)}
                    onClick={() => setImageIndex(index)}
                  >
                    <img src={thumb.url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="shop-details">
            <h1>{product.title}</h1>
            <p className="shop-price">
              {formatShopPrice(price, locale)}
              {product.available ? null : <span className="shop-badge">{t.soldOut}</span>}
            </p>

            {product.options.map((option) => (
              <fieldset className="shop-option" key={option.name}>
                <legend>{isSizeOption(option.name) ? t.size : option.name}</legend>
                <div className="shop-option-values">
                  {option.values.map((value) => {
                    const inStock = valueInStock(product, chosen, option.name, value);

                    return (
                      <label key={value} data-sold-out={!inStock}>
                        <input
                          type="radio"
                          name={option.name}
                          value={value}
                          checked={chosen[option.name] === value}
                          disabled={!inStock}
                          onChange={() => {
                            setProblem(null);
                            setChosen((current) => ({ ...current, [option.name]: value }));
                          }}
                        />
                        <span>{value}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            {product.available ? (
              <div className="shop-buy">
                <label className="shop-quantity">
                  <span>{t.quantity}</span>
                  <select
                    className="input"
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                  >
                    {QUANTITIES.map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="btn btn-red"
                  type="button"
                  disabled={busy}
                  onClick={withVariant((variantId) => addition.mutate(variantId))}
                >
                  {addition.isPending ? t.adding : t.addToCart}
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={busy}
                  onClick={withVariant((variantId) => checkout.mutate(variantId))}
                >
                  {checkout.isPending || checkout.isSuccess ? t.opening : t.buyNow}
                </button>
              </div>
            ) : null}
            {problem === null ? null : (
              <p className="form-error" role="alert">
                {problem}
              </p>
            )}
            <p className="field-hint">{t.checkoutNote}</p>

            {product.description === "" ? null : (
              <p className="shop-description">{product.description}</p>
            )}
            {product.storeUrl === null ? null : (
              <p className="muted">
                <a href={product.storeUrl} target="_blank" rel="noreferrer">
                  {t.viewOnStore}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

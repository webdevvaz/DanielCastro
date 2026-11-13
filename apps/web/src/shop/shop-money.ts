import { NUMBER_LOCALES, type Locale } from "@/i18n/locales";

/** A shop price in a language, with cents: "€29.99" in English, "29,99 €" in Portuguese. */
export const formatShopPrice = (price: ShopMoney, locale: Locale) =>
  new Intl.NumberFormat(NUMBER_LOCALES[locale], {
    style: "currency",
    currency: price.currency,
  }).format(price.amount);

/** A price as the shop sends it. */
type ShopMoney = {
  readonly amount: number;
  readonly currency: string;
};

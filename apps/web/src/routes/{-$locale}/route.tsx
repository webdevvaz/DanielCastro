import { createFileRoute, notFound } from "@tanstack/react-router";
import { Option, Schema } from "effect";

import { PREFIXED_LOCALES } from "@/i18n/locales";
import { descriptionFor } from "@/i18n/site-messages";

const LocalePrefix = Schema.Literals(PREFIXED_LOCALES);

const decodeLocalePrefix = Schema.decodeUnknownOption(LocalePrefix);

/**
 * The public site in every language: `/about` is English, `/pt/about`, `/fr/about`, `/de/about`,
 * and `/es/about` the other languages. Any other first segment is not a page. English has no
 * prefix, so `/en/about` is not a page either. The meta description follows the language.
 */
export const Route = createFileRoute("/{-$locale}")({
  params: {
    parse: (raw) => {
      if (raw.locale === undefined) return { locale: undefined };

      const locale = decodeLocalePrefix(raw.locale);

      if (Option.isNone(locale)) throw notFound();

      return { locale: locale.value };
    },
  },
  head: ({ params }) => ({
    meta: [{ name: "description", content: descriptionFor(params.locale) }],
  }),
});

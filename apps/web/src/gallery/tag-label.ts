import type { Locale } from "@/i18n/locales";
import type { getGalleryTags } from "@/server/gallery/gallery.functions";

/** A theme's or series' translation in each language; empty where it has none. */
export const tagTranslations = (tag: GalleryTag): Record<Locale, string> => ({
  en: tag.nameEn ?? "",
  pt: tag.namePt ?? "",
  fr: tag.nameFr ?? "",
  de: tag.nameDe ?? "",
  es: tag.nameEs ?? "",
});

/** A theme's or series' name in a language: its translation, or its main name without one. */
export const tagLabel = (tag: GalleryTag, locale: Locale) => {
  const translation = tagTranslations(tag)[locale];

  return translation === "" ? tag.name : translation;
};

/** A theme or series as the server sends it. */
export type GalleryTag = Awaited<ReturnType<typeof getGalleryTags>>[number];

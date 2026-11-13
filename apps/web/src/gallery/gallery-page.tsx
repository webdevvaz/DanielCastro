import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useState } from "react";

import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { GalleryFilters } from "./gallery-filters";
import { GalleryGrid } from "./gallery-grid";
import { tagLabel } from "./tag-label";
import { WORK_PAGE_TEXT } from "./work-page-text";

/**
 * The Work page, the site's home page: the full gallery and the themes Daniel enjoys most.
 * Visitors can narrow the gallery to one theme, one series, or both.
 */
export function GalleryPage() {
  const context = useRouteContext({ from: "/{-$locale}/_site/" });
  const site = useSiteMessages();
  const locale = useLocale();
  const t = WORK_PAGE_TEXT[locale];

  const [themeId, setThemeId] = useState<string | null>(null);
  const [seriesId, setSeriesId] = useState<string | null>(null);

  const { data: photos } = useSuspenseQuery(context.galleryQueryOptions);
  const { data: tags } = useSuspenseQuery(context.galleryTagsQueryOptions);

  const usedThemeIds = new Set(photos.flatMap((photo) => photo.themeIds));
  const usedSeriesIds = new Set(photos.map((photo) => photo.seriesId));

  const themes = tags.filter((tag) => tag.kind === "theme" && usedThemeIds.has(tag.id));
  const series = tags.filter((tag) => tag.kind === "series" && usedSeriesIds.has(tag.id));

  const seriesNames = new Map(series.map((item) => [item.id, tagLabel(item, locale)]));

  const shown = photos
    .filter((photo) => themeId === null || photo.themeIds.includes(themeId))
    .filter((photo) => seriesId === null || photo.seriesId === seriesId)
    .map((photo) => ({
      id: photo.id,
      storageKey: photo.storageKey,
      width: photo.width,
      height: photo.height,
      title: photo.title,
      series: photo.seriesId === null ? null : (seriesNames.get(photo.seriesId) ?? null),
      placement: photo.placement,
      featured: photo.featured,
    }));

  const showAll = () => {
    setThemeId(null);
    setSeriesId(null);
  };

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>{t.eyebrow}</b> {t.eyebrowDetail}
            </p>
            <h1>
              {t.headingFirst} <em>{t.headingSecond}</em>
            </h1>
          </div>
          <div>
            <p className="lead">{site.description}</p>
            <p className="theme-list">{t.themes.join(" · ")}</p>
          </div>
        </div>
        {themes.length > 0 || series.length > 0 ? (
          <GalleryFilters
            themes={themes}
            series={series}
            themeId={themeId}
            seriesId={seriesId}
            onThemeChange={setThemeId}
            onSeriesChange={setSeriesId}
          />
        ) : null}
        {photos.length === 0 ? <p className="empty-state">{t.empty}</p> : null}
        {photos.length > 0 && shown.length === 0 ? (
          <div className="empty-state">
            <p>{t.filters.noMatch}</p>
            <button className="btn btn-ghost btn-small" type="button" onClick={showAll}>
              {t.filters.showAll}
            </button>
          </div>
        ) : null}
        {shown.length > 0 ? <GalleryGrid photos={shown} /> : null}
      </div>
    </main>
  );
}

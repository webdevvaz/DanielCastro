import { useId } from "react";

import { useLocale } from "@/i18n/use-locale";

import { tagLabel, type GalleryTag } from "./tag-label";
import { WORK_PAGE_TEXT } from "./work-page-text";

/**
 * The Work page's filters: a button per theme, and a list of the series. Each shows only the
 * themes and series that have photos, in the admin's order. A second press on the chosen theme
 * shows every theme again.
 */
export function GalleryFilters({
  themes,
  series,
  themeId,
  seriesId,
  onThemeChange,
  onSeriesChange,
}: GalleryFiltersProps) {
  const locale = useLocale();
  const t = WORK_PAGE_TEXT[locale].filters;

  const seriesSelectId = useId();

  return (
    <div className="gallery-filters" role="search" aria-label={t.label}>
      {themes.length > 0 ? (
        <div className="filter-chips" role="group" aria-label={t.themes}>
          <button
            className="filter-chip"
            type="button"
            aria-pressed={themeId === null}
            onClick={() => onThemeChange(null)}
          >
            {t.allThemes}
          </button>
          {themes.map((theme) => (
            <button
              className="filter-chip"
              key={theme.id}
              type="button"
              aria-pressed={themeId === theme.id}
              onClick={() => onThemeChange(themeId === theme.id ? null : theme.id)}
            >
              {tagLabel(theme, locale)}
            </button>
          ))}
        </div>
      ) : null}
      {series.length > 0 ? (
        <div className="filter-series">
          <label htmlFor={seriesSelectId}>{t.series}</label>
          <select
            className="input"
            id={seriesSelectId}
            value={seriesId ?? ""}
            onChange={(event) =>
              onSeriesChange(event.target.value === "" ? null : event.target.value)
            }
          >
            <option value="">{t.allSeries}</option>
            {series.map((item) => (
              <option key={item.id} value={item.id}>
                {tagLabel(item, locale)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

type GalleryFiltersProps = {
  readonly themes: ReadonlyArray<GalleryTag>;
  readonly series: ReadonlyArray<GalleryTag>;
  readonly themeId: string | null;
  readonly seriesId: string | null;
  readonly onThemeChange: (id: string | null) => void;
  readonly onSeriesChange: (id: string | null) => void;
};

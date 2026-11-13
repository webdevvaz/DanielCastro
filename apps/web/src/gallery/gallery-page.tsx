import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { GalleryGrid } from "./gallery-grid";
import { WORK_PAGE_TEXT } from "./work-page-text";

/** The Work page, the site's home page: the full gallery and the themes Daniel enjoys most. */
export function GalleryPage() {
  const context = useRouteContext({ from: "/{-$locale}/_site/" });
  const site = useSiteMessages();
  const t = WORK_PAGE_TEXT[useLocale()];

  const { data: photos } = useSuspenseQuery(context.galleryQueryOptions);

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
        {photos.length > 0 ? (
          <GalleryGrid photos={photos} />
        ) : (
          <p className="empty-state">{t.empty}</p>
        )}
      </div>
    </main>
  );
}

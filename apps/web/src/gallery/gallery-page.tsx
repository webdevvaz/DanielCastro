import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { appConfig } from "@/app-config";

import { GalleryGrid } from "./gallery-grid";

/** Themes Daniel enjoys most, from the enquiry form. */
const THEMES = [
  "Anime",
  "Films",
  "Comic books",
  "Video games",
  "Mythologies",
  "Dark fantasy",
  "Gothic",
  "Spooky",
] as const;

/** The Work page, the site's home page: the full gallery. */
export function GalleryPage() {
  const context = useRouteContext({ from: "/_site/" });

  const { data: photos } = useSuspenseQuery(context.galleryQueryOptions);

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <b>Work</b> Braga · Custom tattoos
            </p>
            <h1>
              Characters you love, <em>drawn for skin.</em>
            </h1>
          </div>
          <div>
            <p className="lead">{appConfig.description}</p>
            <p className="theme-list">{THEMES.join(" · ")}</p>
          </div>
        </div>
        {photos.length > 0 ? (
          <GalleryGrid photos={photos} />
        ) : (
          <p className="empty-state">The gallery is being prepared. Come back soon.</p>
        )}
      </div>
    </main>
  );
}

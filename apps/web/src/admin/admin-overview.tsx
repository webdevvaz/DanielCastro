import { studioToday } from "@daniel/shared/studio";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";

import { useAdminText } from "./use-admin-text";

/** The admin home: what is on the site, with links to manage it. */
export function AdminOverview() {
  const context = useRouteContext({ from: "/admin/_dashboard/" });

  const { t } = useAdminText();

  const { data: photos } = useSuspenseQuery(context.adminGalleryQueryOptions);
  const { data: spots } = useSuspenseQuery(context.adminGuestSpotsQueryOptions);
  const { data: travelSettings } = useSuspenseQuery(context.adminTravelSettingsQueryOptions);
  const { data: newEnquiries } = useSuspenseQuery(context.newEnquiryCountQueryOptions);

  const today = studioToday();
  const work = photos.filter((photo) => photo.section === "work");
  const studio = photos.filter((photo) => photo.section === "studio");
  const featured = work.filter((photo) => photo.featured && !photo.hidden).length;
  const hidden = work.filter((photo) => photo.hidden).length;
  const upcoming = spots.filter((spot) => spot.endsOn >= today).length;

  return (
    <>
      <p className="eyebrow">
        <b>{t.nav.label}</b> {t.overview.title}
      </p>
      <h1>{t.overview.welcome}</h1>
      <div className="stats">
        <div className="panel stat">
          <strong>{newEnquiries}</strong>
          <span>{t.overview.newEnquiries}</span>
          <br />
          <Link to="/admin/enquiries">{t.overview.manageEnquiries}</Link>
        </div>
        <div className="panel stat">
          <strong>{work.length}</strong>
          <span>{t.overview.galleryStat(featured, hidden, studio.length)}</span>
          <br />
          <Link to="/admin/gallery">{t.overview.manageGallery}</Link>
        </div>
        <div className="panel stat">
          <strong>{upcoming}</strong>
          <span>{t.overview.upcomingSpots}</span>
          <br />
          <Link to="/admin/guest-spots">{t.overview.manageGuestSpots}</Link>
        </div>
        <div className="panel stat">
          <strong>
            {travelSettings === null ? t.overview.travelNotSet : t.overview.travelSet}
          </strong>
          <span>{t.overview.travelStat}</span>
          <br />
          <Link to="/admin/travel">{t.overview.manageTravel}</Link>
        </div>
        <div className="panel stat">
          <strong>{t.overview.news}</strong>
          <span>{t.overview.newsStat}</span>
          <br />
          <Link to="/admin/instagram">{t.overview.manageInstagram}</Link>
        </div>
      </div>
    </>
  );
}

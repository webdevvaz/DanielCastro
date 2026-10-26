import { studioToday } from "@daniel/shared/studio";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";

/** The admin home: what is on the site, with links to manage it. */
export function AdminOverview() {
  const context = useRouteContext({ from: "/admin/_dashboard/" });

  const { data: photos } = useSuspenseQuery(context.adminGalleryQueryOptions);
  const { data: spots } = useSuspenseQuery(context.adminGuestSpotsQueryOptions);
  const { data: travelSettings } = useSuspenseQuery(context.adminTravelSettingsQueryOptions);

  const today = studioToday();
  const featured = photos.filter((photo) => photo.featured && !photo.hidden).length;
  const hidden = photos.filter((photo) => photo.hidden).length;
  const upcoming = spots.filter((spot) => spot.endsOn >= today).length;

  return (
    <>
      <p className="eyebrow">
        <b>Admin</b> Overview
      </p>
      <h1>Welcome back</h1>
      <div className="stats">
        <div className="panel stat">
          <strong>{photos.length}</strong>
          <span>
            photos in the gallery · {featured} featured · {hidden} hidden
          </span>
          <br />
          <Link to="/admin/gallery">Manage gallery →</Link>
        </div>
        <div className="panel stat">
          <strong>{upcoming}</strong>
          <span>upcoming guest spots</span>
          <br />
          <Link to="/admin/guest-spots">Manage guest spots →</Link>
        </div>
        <div className="panel stat">
          <strong>{travelSettings === null ? "Not set" : "Set"}</strong>
          <span>transport and hotel figures for the travel page</span>
          <br />
          <Link to="/admin/travel">Manage travel →</Link>
        </div>
        <div className="panel stat">
          <strong>News</strong>
          <span>Daniel&apos;s latest Instagram posts on the News page</span>
          <br />
          <Link to="/admin/instagram">Manage Instagram →</Link>
        </div>
      </div>
    </>
  );
}

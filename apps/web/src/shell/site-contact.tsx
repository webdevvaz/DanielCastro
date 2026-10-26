import { Link } from "@tanstack/react-router";

import { appConfig } from "@/app-config";

/** The studio address, email, and social links. The side menu and the phone footer show them. */
export function SiteContact() {
  return (
    <div className="site-contact">
      <h4>Studio</h4>
      <a href={appConfig.links.map} target="_blank" rel="noreferrer">
        {appConfig.studio.addressLines.map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
      </a>
      <p>
        <a href={`mailto:${appConfig.studio.email}`}>{appConfig.studio.email}</a>
        <br />
        By appointment only
      </p>
      <p>
        <a href={appConfig.links.instagram} target="_blank" rel="noreferrer">
          Instagram
        </a>
        {" · "}
        <a href={appConfig.links.youtube} target="_blank" rel="noreferrer">
          YouTube
        </a>
        {" · "}
        <Link to="/admin">Studio admin</Link>
      </p>
    </div>
  );
}

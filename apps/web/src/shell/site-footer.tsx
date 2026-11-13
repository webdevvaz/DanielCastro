import { LanguageSwitcher } from "./language-switcher";
import { SiteContact } from "./site-contact";

/**
 * The contact details and the language switcher at the end of every page on phones; the side
 * menu shows them on desktop.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <SiteContact />
        <LanguageSwitcher className="language-switcher" />
      </div>
    </footer>
  );
}

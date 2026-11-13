/**
 * The public pages in menu order, with the key of their menu label in the site text. A new page
 * adds an entry here. `exact` keeps "Work", the home page, from matching every page. `newsOnly`
 * pages show only while the News page is live, that is, while an Instagram account is connected.
 */
export const SITE_PAGES = [
  { to: "/{-$locale}", label: "work", exact: true, newsOnly: false },
  { to: "/{-$locale}/news", label: "news", exact: false, newsOnly: true },
  { to: "/{-$locale}/guest-spots", label: "guestSpots", exact: false, newsOnly: false },
  { to: "/{-$locale}/travel", label: "travel", exact: false, newsOnly: false },
  { to: "/{-$locale}/how-to-book", label: "howToBook", exact: false, newsOnly: false },
  { to: "/{-$locale}/aftercare", label: "aftercare", exact: false, newsOnly: false },
  { to: "/{-$locale}/about", label: "about", exact: false, newsOnly: false },
] as const;

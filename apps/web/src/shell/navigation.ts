/**
 * The public pages in menu order. A new page adds an entry here. `exact` keeps "Work", the home
 * page, from matching every page. `newsOnly` pages show only while the News page is live, that
 * is, while an Instagram account is connected.
 */
export const SITE_PAGES = [
  { to: "/", label: "Work", exact: true, newsOnly: false },
  { to: "/news", label: "News", exact: false, newsOnly: true },
  { to: "/guest-spots", label: "Guest spots", exact: false, newsOnly: false },
  { to: "/travel", label: "Travel", exact: false, newsOnly: false },
  { to: "/how-to-book", label: "How to book", exact: false, newsOnly: false },
  { to: "/aftercare", label: "Aftercare", exact: false, newsOnly: false },
  { to: "/about", label: "About", exact: false, newsOnly: false },
] as const;

/**
 * The public pages in menu order. A new page adds an entry here. `exact` keeps "Work", the home
 * page, from matching every page.
 */
export const SITE_PAGES = [
  { to: "/", label: "Work", exact: true },
  { to: "/news", label: "News", exact: false },
  { to: "/guest-spots", label: "Guest spots", exact: false },
  { to: "/travel", label: "Travel", exact: false },
  { to: "/how-to-book", label: "How to book", exact: false },
  { to: "/about", label: "About", exact: false },
] as const;

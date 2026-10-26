# shell

The frame around every public page: a side menu on desktop, and a top bar with page tabs and a contact footer on phones. `routes/_site.tsx` puts them around each page.

- `navigation.ts` describes the menu as data. A new page adds an entry there.
- `site-sidebar.tsx` is the desktop side menu: the pages, the next guest spot, "Book a session", and the studio's contact.
- `site-mobile-nav.tsx` and `site-footer.tsx` are the phone bar and footer.
- `site-nav.tsx` and `site-contact.tsx` are shared by the desktop and phone parts.

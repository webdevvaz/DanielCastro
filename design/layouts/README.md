# Layout proposals

Three static proposals for a more functional public site. They keep the site's colors, fonts, and mood (`base.css`) and use real content and photos from `../mockup/assets`. They are not part of `apps/web`.

| File               | Proposal                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `option-a.html`    | **Work first.** Photos lead; "Book a session" in the header; a status line; booking steps, guest spots, and travel together. Phone: bottom booking bar.                    |
| `option-b.html`    | **Booking hub.** A status card and four task tiles (work, book, travel, shop); a booking guide and FAQ. Phone: bottom tab bar.                                             |
| `option-c.html`    | **Studio sidebar.** A fixed side menu with status, booking, and contact; the gallery with filters is the home page; the travel planner is inline. Phone: top bar and tabs. |
| `out/option-*.png` | Each proposal: the full desktop page next to the first phone screen                                                                                                        |

The guest spot and the travel prices are sample content from the local database and one live search on 25 October 2026.

Render again after a change (headless Microsoft Edge, Windows):

```bash
cd design/layouts
node shoot.mjs option-a.html out/a-desktop.png desktop
node shoot.mjs option-a.html out/a-phone.png phone
```

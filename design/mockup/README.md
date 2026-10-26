# Mockup

A static design preview of the Daniel Castro website, to show the direction before the real app is built. It is not part of `apps/web`.

| File                  | Purpose                                                      |
| --------------------- | ------------------------------------------------------------ |
| `index.html`          | The page mockup (desktop and phone layouts)                  |
| `preview-mobile.html` | Opens the mockup at phone width (390 px) in a browser        |
| `teaser.html`         | The 1920 × 1080 teaser: laptop and phone, text in Portuguese |
| `render.sh`           | Renders the images in `out/` with headless Microsoft Edge    |
| `assets/`             | Cropped logos, portfolio photos, and four shop products      |

Prices in the travel section are illustrative. Shop products and prices come from necroticwear.com as of 24 October 2026.

Render again after a change:

```bash
bash design/mockup/render.sh
```

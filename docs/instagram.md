# Instagram

The News page (`/news`) shows Daniel's latest Instagram posts. An admin connects Daniel's account once at `/admin/instagram`; after that the site works by itself:

- It keeps the access token in the database, and renews it when fewer than 30 days of its 60 are left and it is at least a day old. A renewal happens when someone opens the News page or the admin page, so the token expires only when nobody opens either page for about 60 days. The admin page then says so, and "Connect again" fixes it.
- It reads the posts again every 15 minutes, because Instagram's image addresses expire. When Instagram fails, the News page links to Instagram and does not break.
- "Add to gallery" on the admin page copies a post's photo into the gallery (for an album, its first photo). Videos cannot be added. A post can be in the gallery only once.

The site uses Meta's **Instagram API with Instagram Login**, with the `instagram_business_basic` permission only: it reads the profile and the posts, and cannot post, comment, or read messages. Daniel's account must be a professional account (Business or Creator), which it already is.

## One-time setup: the Meta app

Do these steps once, logged in with the Meta account that owns the site's accounts (Daniel's; add the work email as a team member). Meta changes the names in its dashboard from time to time, so a label may differ a little.

1. Open https://developers.facebook.com/apps and create an app. Choose the **Business** app type, and add the **Instagram** product ("API setup with Instagram login").
2. In the Instagram product, under **Business login settings**, add the redirect address (OAuth redirect URI):

   ```
   https://<the site's domain>/api/instagram/callback
   ```

   It must be exactly the server setting `BETTER_AUTH_URL` followed by `/api/instagram/callback`. Meta may refuse an `http://` address; if it refuses `http://localhost:3000/api/instagram/callback`, test the connection on the live site.

3. Add Daniel's Instagram account to the app (**App roles → Roles**, as an Instagram tester), and accept the invitation in Instagram: **Settings → Website permissions → Apps and websites → Tester invites**. Only accounts with a role in the app can connect while the app is in development, which is all this site needs, so the app does not need Meta's review.
4. Copy the **Instagram app ID** and the **Instagram app secret** from the Instagram product's settings. These are not the Facebook app ID and secret at the top of the dashboard.
5. Put them in the server settings (`.env.local` on a computer, the host's secret settings in production), then restart the site:

   ```
   INSTAGRAM_APP_ID=...
   INSTAGRAM_APP_SECRET=...
   ```

   The app secret is a password: never put it in the code, a message, or a screenshot.

## Connecting the account

1. Sign in to the admin area and open **Instagram**.
2. Select **Connect Instagram**. Instagram asks for a login: log in with Daniel's account (`@danielcastro_tattooartist`), and allow access.
3. Instagram sends you back to the admin page, which shows the account and its recent posts.

If the connection fails, the admin page says so. The usual causes: the redirect address in the Meta app is not exactly the one above, the account has no role in the app, or the app ID and secret are the Facebook ones.

To connect a different account, use **Connect another account**. **Disconnect** forgets the account and its token; photos already in the gallery stay.

## How it works

| File                                                      | Holds                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/web/src/server/instagram/instagram-api.server.ts`   | The `InstagramApi` service: login, tokens, posts, and image downloads     |
| `apps/web/src/server/instagram/instagram.server.ts`       | Token renewal, the News feed, the admin view, connect, disconnect, import |
| `apps/web/src/server/instagram/instagram-route.server.ts` | The connect and callback routes, with the state cookie                    |
| `packages/db/src/schema/instagram.ts`                     | `instagram_connection`: one row with the account and its token            |

Security:

- **Login CSRF:** "Connect Instagram" sets a random `state` in an HTTP-only cookie limited to `/api/instagram`, for 10 minutes. The callback connects an account only for a signed-in admin, and only when Instagram returns the same `state`. Without this check, another site could make an admin's browser connect the wrong account.
- **Secrets in addresses:** Instagram takes the access token, and for one request the app secret, as address parameters. Effect's HTTP client records addresses in traces, so tracing is off for every Instagram request, and errors keep only the error type and status.
- **The token** stays on the server. No server function returns it.
- **Downloads** go only to Instagram's image servers (`*.cdninstagram.com`, `*.fbcdn.net`) over HTTPS, are limited to 25 MB, and must be JPG, PNG, or WebP images.
- **Media IDs** from the browser must be digits only, because they become part of a Graph API address.

The integration tests in `apps/web/tests/integration/instagram.test.ts` run all of this against a fake Instagram.

Captions: Meta's documentation lists `caption` among the fields only for Facebook Login. The site asks for it anyway; if the first connection shows "No caption" on posts that have one, the API does not give captions to Instagram Login apps, and the News page shows the photos without text.

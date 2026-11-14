# Instagram

The News page (`/news`) shows Daniel's latest Instagram posts. Daniel connects his account once, from a link an admin sends him (or an admin connects it at `/admin/instagram`); after that the site works by itself:

- The menu shows **News only while it is live**: while an account is connected and its token has not expired. Connecting puts the tab in the menu; disconnecting takes it out. The admin page shows the status ("News page: live" or "hidden"). The check reads the stored connection only, so it costs every public page one small database read and no request to Meta.
- The access token is a **system-user token that never expires** (see below), so the site never renews it. If the configuration is ever changed to give tokens with an expiry, the account needs a new login when the token ends; the admin page then says so.
- It reads the posts again every 15 minutes, because Instagram's image addresses expire. When Meta fails, the News page links to Instagram and does not break.
- "Add to gallery" on the admin page copies a post's photo into the gallery (for an album, its first photo). Videos cannot be added. A post can be in the gallery only once.

## Which Meta login the site uses

Since October 2026, new Meta apps cannot use "API setup with Instagram login" (`instagram.com/oauth/authorize`, which answers "Invalid platform app"). They must use **"Instagram API with Unified login"**: Facebook Login for Business with a **configuration** that gives a system-user access token. The site uses that:

| Step    | Request                                                                                                                                                                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login   | `https://www.facebook.com/v26.0/dialog/oauth` with `client_id`, `config_id`, `redirect_uri`, `response_type=code`, `override_default_response_type=true`, `state`. No `scope`: the configuration sets the permissions.                                                         |
| Token   | `GET https://graph.facebook.com/v26.0/oauth/access_token` with `client_id`, `client_secret`, `redirect_uri`, `code`.                                                                                                                                                           |
| Expiry  | `GET /v26.0/debug_token`; `expires_at` 0 means the token never expires.                                                                                                                                                                                                        |
| Account | `GET /v26.0/me/assigned_instagram_accounts?fields=id,username` (needs `business_management`). When it is empty or refused: the `instagram_basic` entry of `debug_token`'s `granular_scopes` names the account ID, and `GET /v26.0/{id}?fields=id,username` gives its username. |
| Posts   | `GET /v26.0/{instagram-account-id}/media` on `graph.facebook.com`.                                                                                                                                                                                                             |

Meta's documentation for Unified login is thin. These steps follow what other developers reported working in November 2026 (for example [OpenReply #104](https://github.com/diwenne/openreply/issues/104) and [Postiz #2404](https://github.com/gitroomhq/postiz-app/pull/2404)); check them against the first real connection.

## One-time setup: the Meta app

Do these steps once, logged in to developers.facebook.com with your own account. Meta changes the names in its dashboard from time to time, so a label may differ a little.

1. **Create the app.** On Use cases, filter by **Content management**, tick **Manage messaging & content on Instagram**, and create the app without a business portfolio.
2. **Business portfolio.** Open **Use cases → Customize → API setup with Unified login**. It asks for a business portfolio first; create one with your own name and email. A brand-new Facebook account must wait an hour or more before Meta allows it.
3. **Redirect URL.** In **1. Configure your app**, register:

   ```
   https://<the site's domain>/api/instagram/callback
   ```

   It must be exactly `BETTER_AUTH_URL` followed by `/api/instagram/callback`.

4. **Configuration.** Click **Create new configuration**: system-user access token, expiration **Never**, asset **Instagram account**. The site needs only `instagram_basic`; untick the other permissions if Meta allows it. Copy the **configuration ID**.
5. **Facebook Login for Business.** Add this product. In its **Settings → Valid OAuth Redirect URIs**, add the same redirect URL. `business_management` is optional: Meta's configuration editors often do not offer it, and the site then finds the account from the token's details.
6. **Tester.** In **App roles → Roles**, add `danielcastro_tattooartist` as an **Instagram Tester**. Daniel accepts the invitation once (instagram.com → Settings → Website permissions → Apps and websites → Tester invites). With a role in the app, the app needs no App Review.
7. **Keys.** From **App settings → Basic**, copy the **App ID** and **App secret**. Put them and the configuration ID in the server settings (`.env.local` on a computer, the host's variables in production), then restart the site:

   ```
   INSTAGRAM_APP_ID=<App ID>
   INSTAGRAM_APP_SECRET=<App secret>
   INSTAGRAM_CONFIG_ID=<configuration ID>
   ```

   The app secret is a password: never put it in the code, a message, or a screenshot.

## Connecting the account

1. Sign in to the admin area and open **Instagram**.
2. Select **Connect Instagram**. Meta's login opens: choose to continue with Instagram, log in with Daniel's account (`@danielcastro_tattooartist`), and allow access.
3. Meta sends you back to the admin page, which shows the account and its recent posts.

If the connection fails, the admin page says so. The usual causes: the redirect address is missing from the configuration or from Facebook Login for Business, the account has no role in the app, or the login gave access to no Instagram account. The server log names the failed step (`exchangeCode`, `debugToken`, `account`).

### From a link, without an admin account

Daniel does not need an admin account. On the admin **Instagram** page, under **Link for Daniel**, an admin creates a link for `@danielcastro_tattooartist` (the field is filled in) and sends it to him, for example on WhatsApp. On his phone he opens it, accepts the tester invitation once if Instagram asks (the page links to it), presses **Connect Instagram**, and allows access. The page then says whether it worked.

- The link is `/admin/connect-instagram/<token>`. The token names the account and the admin who made it, expires after 7 days, and is signed with a key derived from `BETTER_AUTH_SECRET`; nothing is stored, and changing the secret makes every link invalid.
- It connects **only the account it names**. If someone logs in with another account, nothing changes and the page says so. A leaked or edited link therefore cannot put another account's posts on the News page.
- The connection is recorded as made by the admin who created the link.

To connect a different account, use **Connect another account**. **Disconnect** forgets the account and its token; photos already in the gallery stay.

## How it works

| File                                                             | Holds                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/web/src/server/instagram/instagram-api.server.ts`          | The `InstagramApi` service: login, tokens, posts, and image downloads     |
| `apps/web/src/server/instagram/instagram.server.ts`              | Token renewal, the News feed, the admin view, connect, disconnect, import |
| `apps/web/src/server/instagram/instagram-route.server.ts`        | The connect and callback routes, with the state cookie                    |
| `apps/web/src/server/instagram/instagram-connect-link.server.ts` | Signing and checking connect links                                        |
| `packages/db/src/schema/instagram.ts`                            | `instagram_connection`: one row with the account and its token            |

Security:

- **Login CSRF:** "Connect Instagram" sets a random `state` in an HTTP-only cookie limited to `/api/instagram`, for 10 minutes. The callback connects an account only when Instagram returns the same `state`, and then only for a signed-in admin or a valid connect link (whose token rides in the same cookie, after the state). Without this check, another site could make an admin's browser connect the wrong account.
- **Secrets in addresses:** Meta takes the access token, and for the token exchange and `debug_token` the app secret, as address parameters. Effect's HTTP client records addresses in traces, so tracing is off for every Instagram request, and errors keep only the error type and status.
- **The token** stays on the server. No server function returns it.
- **Downloads** go only to Instagram's image servers (`*.cdninstagram.com`, `*.fbcdn.net`) over HTTPS, are limited to 25 MB, and must be JPG, PNG, or WebP images.
- **Media IDs** from the browser must be digits only, because they become part of a Graph API address.

The integration tests in `apps/web/tests/integration/instagram.test.ts` run all of this against a fake Meta.

Captions: Meta's documentation lists `caption` among the fields only for Facebook Login. The site asks for it anyway; if the first connection shows "No caption" on posts that have one, the API does not give captions to Instagram Login apps, and the News page shows the photos without text.

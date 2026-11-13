# Deploying

The site runs as one container image (`Containerfile`) with three things around it: a PostgreSQL database, a disk folder for the gallery photos and the photos clients send with enquiries, and an `https://` address. The test site for Daniel runs on [Railway](https://railway.com), which builds the image from the GitHub repository on every push to `main`.

## What a new version does

1. Railway builds the image from the `Containerfile`.
2. The pre-deploy step runs `node /app/release/migrate.mjs`, which applies new migrations. When it fails, Railway stops the deploy and the current version keeps running.
3. Railway starts the new version, waits until `/api/ready` answers, and then sends traffic to it.

## One-time setup on Railway

Railway changes the names in its dashboard from time to time, so a label may differ a little. Use the dashboard settings below, not a `railway.json` file: Railway is replacing that file format.

1. **Project.** Create a project with **Deploy from GitHub repo**, and pick `webdevvaz/DanielCastro`. Railway asks for access to the GitHub account the first time.
2. **Database.** In the project, add a **PostgreSQL** database. Railway names it `Postgres`.
3. **Photo disk.** Add a **volume** to the web service, with the mount path `/data`.
4. **Address.** In the web service, open **Settings → Networking** and select **Generate Domain**. If Railway asks for a port, enter `3000`. Copy the address, for example `https://danielcastro-production.up.railway.app`.
5. **Settings.** In the web service, open **Variables → Raw Editor** and paste these, with your values:

   ```
   RAILWAY_DOCKERFILE_PATH=Containerfile
   RAILWAY_RUN_UID=0
   PORT=3000
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   BETTER_AUTH_URL=https://<the address from step 4>
   BETTER_AUTH_SECRET=<a new secret: openssl rand -base64 32>
   AUTH_IP_ADDRESS_HEADER=x-real-ip
   PHOTO_STORAGE_DIR=/data/photos
   HIDE_FROM_SEARCH_ENGINES=true
   TRAVELPAYOUTS_TOKEN=<the Travelpayouts token>
   SERPAPI_API_KEY=<the SerpApi key>
   ```

   - `RAILWAY_DOCKERFILE_PATH` tells Railway to build from the `Containerfile`, because it looks only for a file named `Dockerfile`.
   - `RAILWAY_RUN_UID=0`: Railway mounts volumes for the root user, and the image runs as the `node` user, which then cannot save photos. This setting runs the container as root, as Railway recommends.
   - `BETTER_AUTH_URL` must be the exact address, with `https://` and without a slash at the end. Sign-in cookies and the Instagram login depend on it.
   - `BETTER_AUTH_SECRET` must be new: never reuse the one in your `.env.local`.
   - `HIDE_FROM_SEARCH_ENGINES=true` keeps the test site out of Google. Leave it out on the real site.
   - Add `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET` when the Meta app exists (`docs/instagram.md`).
   - Enquiry emails need no variable: an admin saves the Resend API key, the sender, and the recipients on the admin **Email** page, once the site's domain is verified in Resend. Until then, enquiries are saved and listed in the admin area only.

6. **Deploy steps.** In the web service, open **Settings → Deploy**:
   - **Pre-deploy command:** `node /app/release/migrate.mjs`
   - **Healthcheck path:** `/api/ready`
7. **First deploy.** Deploy the service, and wait until it is active. Open the address; the site shows an empty gallery.

## Admin accounts

The release image cannot create accounts, so create them once from your computer:

1. In Railway, open the `Postgres` service, then **Variables**, and copy `DATABASE_PUBLIC_URL`.
2. In PowerShell, in `B:\Projects\Daniel`:

   ```powershell
   $env:DATABASE_URL = "<DATABASE_PUBLIC_URL>"
   $env:ADMIN_EMAILS = "webdev.vaz@gmail.com,<Daniel's email>"
   $env:ADMIN_INITIAL_PASSWORD = "<a new password, at least 12 characters>"
   pnpm db:seed-admins
   Remove-Item Env:DATABASE_URL, Env:ADMIN_EMAILS, Env:ADMIN_INITIAL_PASSWORD
   ```

   The values you set here win over the ones in `.env.local`. The last line removes them from the PowerShell window, so the next command uses your local database again.

3. Sign in at `<address>/admin`, and change the password when Daniel has his own.

Run it again to add an admin later; existing accounts are skipped.

## Checks after the first deploy

- `<address>/api/ready` answers `Ready`.
- Upload a photo in the admin area, then deploy again (for example with **Redeploy**): the photo must still be there. If it is gone, the volume is not mounted at `/data`.
- In the web service's logs, look for the Better Auth warning "Rate limiting could not determine a client IP". If it shows, Railway does not send `X-Real-IP`: try `AUTH_IP_ADDRESS_HEADER=x-forwarded-for`. The enquiry form's rate limit reads the same header.

## Costs and limits

- **Travelpayouts:** free, with no monthly limit. The site reads each city's fares once a day.
- **SerpApi:** hotels use it for every trip estimate with new dates (one search; the same dates again within 6 hours use none, and so does the example trip for every visitor on the same day). Flights use it only for routes with too few Travelpayouts fares, mostly from outside Europe: one search per city and dates, reused for a day. The free plan has 250 searches a month, shared by your computer and every site that uses the key. When they are used up, the hotel card shows the typical hotel prices, and rare routes show an average of all airlines or only the Google Flights button, until the next month.
- **Backups:** Railway can back up the database and the volume. Turn on automatic backups for both before Daniel starts adding real photos. The volume also holds clients' enquiry photos.

# Daniel

The website of Daniel Castro, Tattoo Artist®, a studio in Braga, Portugal. It was built from the structural website template: the template fixed the language, the package layout, the tooling, and the coding conventions; the features and the look are Daniel's own. `PRODUCT.md` says what the site is for.

## What works today

- **Public site**: a side menu on every page (on phones, a top bar with page tabs) with the next guest spot, "Book a session", and the studio contact. Pages: Work (`/`, the full gallery; featured photos are large tiles), News (`/news`, Daniel's latest Instagram posts), Guest spots (`/guest-spots`), Travel (`/travel`), How to book (`/how-to-book`: steps, what to send, FAQ), and About (`/about`, placeholder bio and awards). Shop opens necroticwear.com until the Shopify page exists.
- **Travel estimator**: the visitor enters their city (with suggestions) and, optionally, their dates. The page shows up to three live Google Flights fares to Porto (through SerpApi; without dates, for an example trip four weeks ahead), the bus, a rental car, and Uber from the airport (priced for the whole trip), the 3 cheapest good hotels in Braga with live prices and their average, driving directions from Portugal and Spain, and a total range for one person. Links open Google Flights, Booking.com, and Google Maps with the search filled in. City suggestions come from the Travelpayouts place search, which needs no account; flight and hotel prices need `SERPAPI_API_KEY`. When a source has no answer or fails, the page shows the links only.
- **Admin area** at `/admin` (admins only, no public sign-up):
  - **Gallery**: drop photos to upload them (JPG, PNG, or WebP up to 25 MB; converted to WebP in two sizes), add a title, series, and placement, feature photos (large tiles on the Work page), hide photos, delete them, and drag or use the arrows to change the order.
  - **Guest spots**: add, edit, and delete spots. A spot shows on the Guest spots page and in the side menu until its last day has passed, as "Books open" or "Fully booked".
  - **Travel**: the typical prices that the travel estimator shows and adds up: the airport bus (one way), a rental car (per day), Uber (one way), the drive time, and hotels in Braga (used when live hotel prices are not available).
  - **Instagram**: "Connect Instagram" logs in to Daniel's account once; the site keeps the access renewed and shows the posts on the News page. "Add to gallery" copies a post's photo into the gallery. Needs a Meta app: see `docs/instagram.md`.

Still to come (see `PRODUCT.md`): the site's own enquiry form (the button still opens the Google Form), the Necrotic Wear shop, Portuguese and English versions, and the legal footer.

Stack: TypeScript, TanStack Start (React 19), TanStack Query, Router, Form, and Table, Better Auth, Drizzle on PostgreSQL, and Effect v4 for all backend work. Tooling: pnpm workspaces with a version catalog, Vite+ (`vp`) for build, test, format, and lint (oxlint), and the Effect language service.

## Layout

```
.
├── .agents/skills/        Agent skills: implementation rules (daniel-impl) and Drizzle guides
├── apps/
│   └── web/               TanStack Start app
│       ├── public/        Static files
│       ├── src/
│       │   ├── routes/                    File-based routes (+ api/ server routes)
│       │   ├── server/                    *.functions.ts, *.server.ts, *.middleware.ts, runtime
│       │   ├── integrations/tanstack-query/  <domain>-query-options.ts
│       │   ├── shell/                     Layout, navigation, header, login
│       │   ├── components/                Components shared by features of this app
│       │   ├── forms/                     useAppForm and field components
│       │   ├── defaults/                  Error and not-found pages
│       │   └── <feature>/                 One directory per feature
│       └── tests/{unit,integration}
├── packages/
│   ├── db/                Drizzle schema, migrations (drizzle/), Database service, queries
│   ├── auth/              Better Auth, Auth service, roles
│   ├── shared/            Effect Schema contracts, AppError, reusable React components
│   └── utils/             Helpers used by more than one package
├── tooling/tsconfig/      Shared tsconfig base
├── docs/                  Architecture, client, security, testing, observability, Instagram guides
├── AGENTS.md              Rules for coding agents
├── PRODUCT.md             What this app is for (fill in per site)
├── compose.yaml           Local PostgreSQL and telemetry
└── Containerfile          Production image
```

Dependencies point one way: `web → auth → db → shared → utils`. Every source directory has a `README.md` that says what goes in it.

## Getting started

1. Install the packages and create the settings file:

   ```bash
   pnpm install
   cp .env.example .env.local
   ```

   In `.env.local`, set `BETTER_AUTH_SECRET`, `ADMIN_EMAILS`, and `ADMIN_INITIAL_PASSWORD`. When the PostgreSQL programs are not on `PATH` (common on Windows), set `PG_BIN` to their folder.

2. Start PostgreSQL. Either run it directly from the PostgreSQL programs:

   ```bash
   pnpm db:local start     # also: pnpm db:local status, pnpm db:local stop
   ```

   or with containers: `podman compose up -d postgres` (or `docker compose`). `db:local` keeps its data in `.data/postgres` and creates the database from `DATABASE_URL` the first time.

3. Create the tables and the admin accounts, then start the site:

   ```bash
   pnpm db:migrate
   pnpm db:seed-admins
   pnpm dev
   ```

4. Open http://localhost:3000, and sign in at http://localhost:3000/admin with an email from `ADMIN_EMAILS` and `ADMIN_INITIAL_PASSWORD`.

Uploaded photos are files in `PHOTO_STORAGE_DIR` (`.data/photos` by default), not in the database. Back up that folder together with the database.

To build a new feature, follow the walkthrough in `docs/architecture.md`.

## Commands

| Command                 | Does                                          |
| ----------------------- | --------------------------------------------- |
| `pnpm dev`              | Starts the web app on port 3000               |
| `pnpm build`            | Builds every workspace                        |
| `pnpm fmt`              | Formats the code                              |
| `pnpm typecheck`        | Type-checks every workspace                   |
| `pnpm lint`             | oxlint plus Effect diagnostics; warnings fail |
| `pnpm quality:fast`     | Format check, type check, and lint            |
| `pnpm test`             | Unit tests                                    |
| `pnpm test:integration` | Database and server-boundary tests            |
| `pnpm test:all`         | Unit and integration tests                    |
| `pnpm db:local start`   | Starts a local PostgreSQL (`status`, `stop`)  |
| `pnpm db:generate`      | Generates a migration from the Drizzle schema |
| `pnpm db:migrate`       | Applies migrations                            |
| `pnpm db:seed-admins`   | Creates the admin accounts in `ADMIN_EMAILS`  |
| `pnpm db:studio`        | Opens Drizzle Studio                          |

## Requirements

Node 26, pnpm 12, and PostgreSQL 18 (from `compose.yaml`, or the PostgreSQL programs on `PATH` or in `PG_BIN`). The integration tests start a private PostgreSQL cluster for each test file with `initdb` and `pg_ctl`, so they need those programs even when the app uses the container.

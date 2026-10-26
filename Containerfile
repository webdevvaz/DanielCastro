# Production image for apps/web, built with Podman from the repository root:
#
#   podman build --format docker -t daniel .                  # the web server
#   podman build -t daniel-migrate --target migrate .         # a one-shot migration job
#
# `--format docker` keeps the HEALTHCHECK below: Podman's default OCI image format has no health
# check field and drops it with a warning. Image names are fully qualified (docker.io/...)
# because Podman does not guess a registry for short names.
#
# Configuration comes from the environment at run time (see .env.example). Run the migrate image
# with DATABASE_URL before you start a new web version.

FROM docker.io/library/node:26-bookworm-slim AS build

WORKDIR /workspace

RUN npm install --global --allow-scripts=pnpm pnpm@12.3.4

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/utils/package.json packages/utils/package.json
COPY tooling/tsconfig/package.json tooling/tsconfig/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter web build

# Applies pending Drizzle migrations, then exits.
FROM build AS migrate

CMD ["pnpm", "--filter", "@daniel/db", "db:migrate"]

# The Nitro output bundles the server and its dependencies, so the runtime image needs no install.
FROM docker.io/library/node:26-bookworm-slim AS runtime

ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY --from=build --chown=node:node /workspace/apps/web/.output ./

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

CMD ["node", "server/index.mjs"]

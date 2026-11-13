import { defineConfig, defineProject } from "vite-plus";

/**
 * Test projects for the database package: fast unit tests and PostgreSQL integration tests. `vp
 * pack` bundles the migration script for the release image, which has no `node_modules`.
 */
export default defineConfig({
  pack: {
    entry: { migrate: "src/scripts/migrate.ts" },
    outDir: "dist/release",
    platform: "node",
    format: "esm",
    // Every dependency goes in the bundle, except `pg-native`: `pg` loads it only on request.
    deps: { alwaysBundle: [/^(?!pg-native$)/] },
  },
  test: {
    projects: [
      defineProject({
        test: { name: "unit", include: ["tests/unit/**/*.test.ts"] },
      }),
      defineProject({
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          hookTimeout: 120_000,
          testTimeout: 60_000,
        },
      }),
    ],
  },
});

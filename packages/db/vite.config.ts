import { defineConfig, defineProject } from "vite-plus";

/** Test projects for the database package: fast unit tests and PostgreSQL integration tests. */
export default defineConfig({
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

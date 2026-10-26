import "vite-plus/test/config";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { type TestProjectInlineConfiguration, defineConfig, defineProject } from "vite-plus";

const unitTestProject = {
  extends: true,
  test: {
    name: "unit",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
} satisfies TestProjectInlineConfiguration;

/** Server-boundary tests against Better Auth and a private PostgreSQL cluster. */
const integrationTestProject = {
  extends: true,
  test: {
    name: "integration",
    include: ["tests/integration/**/*.test.{ts,tsx}"],
    hookTimeout: 120_000,
    testTimeout: 60_000,
  },
} satisfies TestProjectInlineConfiguration;

export default defineConfig(({ mode, command }) => ({
  envDir: "../..",
  ssr: {
    // Keep React and hook-based dependencies on one runtime across Nitro's lazy SSR chunks.
    noExternal: command === "build" ? true : ["@tanstack/router-core", "@tanstack/react-router"],
    // sharp loads a native library, so it cannot be bundled; Nitro copies it into the output.
    external: ["sharp"],
  },
  optimizeDeps: {
    exclude: ["@daniel/auth", "@daniel/db", "better-auth", "sharp"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({
      router: {
        codeSplittingOptions: {
          // `pendingComponent` stays in each route's main chunk, which loads with the route tree,
          // so the skeleton renders at once. In the component's lazy chunk it would itself
          // suspend while that chunk loads, and the whole app would go blank on a slow network.
          defaultBehavior: [["component"], ["errorComponent"], ["notFoundComponent"]],
        },
      },
    }),
    ...(mode === "test" ? [] : [nitro({ plugins: ["./src/server/nitro/runtime-shutdown.ts"] })]),
    viteReact({ compiler: true }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
  test: {
    projects: [defineProject(unitTestProject), defineProject(integrationTestProject)],
  },
}));

import effectAntipattern from "@effect/tsgo/oxlint-presets/antipattern.json" with { type: "json" };
import effectCorrectness from "@effect/tsgo/oxlint-presets/correctness.json" with { type: "json" };
import effectNative from "@effect/tsgo/oxlint-presets/effect-native.json" with { type: "json" };
import effectStyle from "@effect/tsgo/oxlint-presets/style.json" with { type: "json" };
import { defineConfig } from "vite-plus";

const effectPolicyRules = Object.fromEntries([
  // Change this severity to "warn" to enable the Effect-native and style presets.
  ...[effectNative, effectStyle].flatMap(({ rules }) =>
    Object.keys(rules).map((rule): [string, "off"] => [rule, "off"]),
  ),
  ...[effectCorrectness, effectAntipattern].flatMap(({ rules }) =>
    Object.keys(rules).map((rule): [string, "warn"] => [rule, "warn"]),
  ),
]);

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/dist/**", "**/.{idea,git,cache,output,temp}/**"],
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
  fmt: {
    ignorePatterns: [
      "node_modules",
      "pnpm-lock.yaml",
      "*.tsbuildinfo",
      "**/routeTree.gen.ts",
      "*.icon/**",
    ],
    sortPackageJson: {},
    sortImports: {
      groups: [
        "type-import",
        ["value-builtin", "value-external"],
        "type-internal",
        "value-internal",
        ["type-parent", "type-sibling", "type-index"],
        ["value-parent", "value-sibling", "value-index"],
        "unknown",
      ],
    },
  },
  lint: {
    ignorePatterns: [
      "dist",
      "node_modules",
      "pnpm-lock.yaml",
      "*.tsbuildinfo",
      "**/routeTree.gen.ts",
    ],
    plugins: ["eslint", "jsx-a11y", "oxc", "react", "unicorn", "typescript"],
    categories: {
      correctness: "error",
      suspicious: "error",
      perf: "error",
    },

    rules: {
      complexity: "error",
      "oxc/no-accumulating-spread": "error",
      "unicorn/no-array-sort": "off",
      "react-in-jsx-scope": "off",
      "react/jsx-no-constructed-context-values": "off",
      "eslint/no-shadow": "off",
      "eslint/no-await-in-loop": "off",
      "eslint/no-underscore-dangle": "off",
      "typescript/no-explicit-any": "error",
      "typescript/no-floating-promises": "error",
      "typescript/no-inferrable-types": "error",
      "typescript/no-misused-promises": "error",
      "typescript/no-deprecated": "error",
      "typescript/prefer-readonly": "error",
      "typescript/switch-exhaustiveness-check": "error",
      "react/rules-of-hooks": "error",
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/aria-activedescendant-has-tabindex": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/autocomplete-valid": "error",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/iframe-has-title": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/lang": "error",
      "jsx-a11y/media-has-caption": "error",
      "jsx-a11y/mouse-events-have-key-events": "error",
      "jsx-a11y/no-access-key": "error",
      "jsx-a11y/no-aria-hidden-on-focusable": "error",
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/no-distracting-elements": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/no-noninteractive-tabindex": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/prefer-tag-over-role": "off",
      "jsx-a11y/role-has-required-aria-props": "off",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/scope": "error",
      "jsx-a11y/tabindex-no-positive": "error",
      "@tanstack/query/exhaustive-deps": "error",
      "@tanstack/query/infinite-query-property-order": "error",
      "@tanstack/query/mutation-property-order": "error",
      "@tanstack/query/no-rest-destructuring": "error",
      "@tanstack/query/no-unstable-deps": "error",
      "@tanstack/query/no-void-query-fn": "error",
      "@tanstack/query/stable-query-client": "error",
      "@tanstack/router/create-route-property-order": "error",
      "@tanstack/router/route-param-names": "error",
      "typescript/no-unsafe-type-assertion": "off",
      "typescript/restrict-template-expressions": "off",
      "typescript/consistent-return": "off",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        files: [
          "apps/*/src/**/*.cts",
          "apps/*/src/**/*.mts",
          "apps/*/src/**/*.ts",
          "apps/*/src/**/*.tsx",
          "packages/*/src/**/*.cts",
          "packages/*/src/**/*.mts",
          "packages/*/src/**/*.ts",
          "packages/*/src/**/*.tsx",
        ],
        plugins: ["effecttsgo", "eslint", "jsx-a11y", "oxc", "react", "unicorn", "typescript"],
        rules: {
          ...effectPolicyRules,
          // Change this to "warn" after scoping the valid CLI entry-point provisions.
          "effecttsgo/strict-effect-provide": "off",
          "@stylistic/padding-line-between-statements": [
            "error",
            {
              blankLine: "always",
              prev: ["const", "let", "var"],
              next: "*",
            },
            {
              blankLine: "any",
              prev: ["const", "let", "var"],
              next: ["const", "let", "var"],
            },
            {
              blankLine: "always",
              prev: "block-like",
              next: "*",
            },
            {
              blankLine: "always",
              prev: "*",
              next: ["return", "throw"],
            },
          ],
          "typescript/consistent-type-imports": "error",
          "typescript/no-import-type-side-effects": "error",
          "typescript/no-unnecessary-condition": "error",
          "typescript/no-unsafe-argument": "error",
          "typescript/no-unsafe-assignment": "error",
          "typescript/no-unsafe-call": "error",
          "typescript/no-unsafe-member-access": "error",
          "typescript/no-unsafe-return": "error",
        },
      },
      {
        // Effect fibers can resume in another request's async context, so server programs must
        // not read request state directly. `runServerEffect` captures the headers and provides
        // them as the `RequestHeaders` service (apps/web/src/server/request-headers.server.ts).
        files: ["apps/web/src/server/**/*.ts"],
        rules: {
          "eslint/no-restricted-imports": [
            "error",
            {
              paths: [
                {
                  name: "@tanstack/react-start/server",
                  importNames: [
                    "getRequestHeaders",
                    "getRequestHeader",
                    "getRequest",
                    "getCookie",
                    "getCookies",
                  ],
                  message:
                    "Read request data from the RequestHeaders service inside server programs.",
                },
              ],
            },
          ],
        },
      },
      {
        files: ["apps/web/src/server/run.server.ts"],
        rules: { "eslint/no-restricted-imports": "off" },
      },
      {
        // Placeholder entry points of a new project. Remove a file from this list once it has code.
        files: ["packages/utils/src/index.ts"],
        rules: { "unicorn/no-empty-file": "off" },
      },
    ],
    jsPlugins: [
      {
        name: "@stylistic",
        specifier: "@stylistic/eslint-plugin",
      },
      {
        name: "@tanstack/query",
        specifier: "@tanstack/eslint-plugin-query",
      },
      {
        name: "@tanstack/router",
        specifier: "@tanstack/eslint-plugin-router",
      },
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
});

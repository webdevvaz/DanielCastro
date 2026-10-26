import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
  },
});

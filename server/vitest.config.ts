import { defineConfig } from "vitest/config";

// Server tests run in plain Node (no jsdom, no SPA setup). A local config keeps
// vitest from walking up into the root SPA's vite.config.ts.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    pool: "forks",
    fileParallelism: false,
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
    hookTimeout: 20000,
  },
});

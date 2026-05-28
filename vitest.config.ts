import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["app/**/*.{test,spec}.{ts,tsx}"],
    environment: "happy-dom",
  },
});

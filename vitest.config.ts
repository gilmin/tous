import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // Match the project's "@/" → root alias (tsconfig paths) so tests outside
    // app/ (e.g. lib/) can import via "@/..." like the app code does.
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    include: ["{app,lib}/**/*.{test,spec}.{ts,tsx}"],
    environment: "happy-dom",
  },
});

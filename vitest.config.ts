import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Vitest config: happy-dom is ~3× faster than jsdom for our component tests
// and supports everything we need (IntersectionObserver, matchMedia, etc.)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["node_modules", "tests/load/**", ".next"],
    css: false, // skip css processing in tests
    coverage: {
      reporter: ["text", "html"],
      exclude: ["**/*.test.*", "tests/**", ".next/**"],
    },
  },
});

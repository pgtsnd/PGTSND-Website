import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "src", "assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: [
      "tests/**/*.test.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
    ],
    setupFiles: ["./tests/setup.ts", "./src/__tests__/setup.ts"],
    css: false,
  },
});

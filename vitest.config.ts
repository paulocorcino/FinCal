import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^next\/server$/, replacement: "next/server.js" },
      { find: /^next\/headers$/, replacement: "next/headers.js" },
      { find: "@", replacement: path.resolve(__dirname) },
    ],
  },
  test: {
    environment: "jsdom",
    exclude: ["**/*.integration.test.ts", "node_modules"],
  },
});

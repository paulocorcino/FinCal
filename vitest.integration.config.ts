import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^next\/server$/, replacement: "next/server.js" },
      { find: /^next\/headers$/, replacement: "next/headers.js" },
      { find: "@", replacement: path.resolve(__dirname) },
    ],
  },
  test: {
    environment: "node",
    include: ["__tests__/**/*.integration.test.ts"],
    setupFiles: ["__tests__/setup-integration.ts"],
    server: {
      deps: {
        inline: [/next-auth/, /@auth\/core/],
      },
    },
  },
});

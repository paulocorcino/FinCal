import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const dbFile = path.resolve(repoRoot, "prisma", "e2e-smoke.db");
const dbUrl = `file:${dbFile}`;

process.env.DATABASE_URL = dbUrl;
process.env.AUTH_SECRET = "e2e-smoke-secret-32chars-minimo";
process.env.AUTH_TRUST_HOST = "true";

const journalFile = `${dbFile}-journal`;

for (const file of [dbFile, journalFile]) {
  if (fs.existsSync(file)) {
    fs.rmSync(file, { force: true });
  }
}

const migrate = spawn("npx", ["prisma", "migrate", "deploy"], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: dbUrl },
});

migrate.on("close", (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }

  const server = spawn("node", [".next/standalone/server.js"], {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  server.on("close", (serverCode) => {
    process.exit(serverCode ?? 0);
  });
});

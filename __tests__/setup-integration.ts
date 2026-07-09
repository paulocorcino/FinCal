import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

process.env.DATABASE_URL = "file:./test-integration.db";
process.env.AUTH_SECRET = "test-secret";

const dbFile = path.resolve(process.cwd(), "prisma", "test-integration.db");
const journalFile = `${dbFile}-journal`;

for (const file of [dbFile, journalFile]) {
  if (fs.existsSync(file)) {
    fs.rmSync(file, { force: true });
  }
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });

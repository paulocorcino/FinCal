import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

process.env.DATABASE_URL = "file:./test-integration.db";
process.env.AUTH_SECRET = "test-secret";
process.env.AUTH_TRUST_HOST = "true";

const dbFile = path.resolve(process.cwd(), "prisma", "test-integration.db");
const journalFile = `${dbFile}-journal`;

await prisma.$disconnect();

for (const file of [dbFile, journalFile]) {
  if (fs.existsSync(file)) {
    fs.rmSync(file, { force: true });
  }
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

process.env.DATABASE_URL = "file:./e2e-smoke.db";
process.env.AUTH_SECRET = "e2e-smoke-secret-32chars-minimo";
process.env.AUTH_TRUST_HOST = "true";

const dbFile = path.resolve(process.cwd(), "prisma", "e2e-smoke.db");
const journalFile = `${dbFile}-journal`;

export default async function globalSetup() {
  await prisma.$disconnect();

  for (const file of [dbFile, journalFile]) {
    if (fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }

  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}

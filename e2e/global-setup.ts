export default async function globalSetup() {
  process.env.DATABASE_URL = "file:./e2e-smoke.db";
  process.env.AUTH_SECRET = "e2e-smoke-secret-32chars-minimo";
  process.env.AUTH_TRUST_HOST = "true";
}

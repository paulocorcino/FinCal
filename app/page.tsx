import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let value: string;
  try {
    const row = await prisma.healthCheck.findFirst();
    value = row?.value ?? "No health check row found";
  } catch (e) {
    value = `DB error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return (
    <main>
      <h1>FinCal</h1>
      <p data-testid="db-value">{value}</p>
    </main>
  );
}

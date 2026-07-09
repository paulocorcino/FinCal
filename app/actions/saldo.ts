"use server";

import { auth } from "@/lib/auth";
import { saldoQuerySchema } from "@/lib/saldo-schema";
import { getSaldoForUser } from "@/lib/saldo-service";
import type { SaldoResultado } from "@/lib/saldo";

export async function getSaldoAction(filters: {
  contaId?: string;
  ate?: string;
}): Promise<SaldoResultado | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const parsed = saldoQuerySchema.safeParse(filters);
  if (!parsed.success) {
    return null;
  }

  return getSaldoForUser(session.user.id, parsed.data);
}

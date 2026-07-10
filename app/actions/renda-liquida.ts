"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { rendaLiquidaSchema } from "@/lib/renda-liquida-schema";
import {
  createRendaLiquida,
  getRendaLiquidaVigente,
} from "@/lib/renda-liquida";

export async function createRendaLiquidaAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  const raw = Object.fromEntries(formData);
  const parsed = rendaLiquidaSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  await createRendaLiquida(session.user.id, parsed.data);
  revalidatePath("/dashboard/diagnostico");
}

export async function getRendaLiquidaVigenteAction(mes: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return getRendaLiquidaVigente(session.user.id, mes);
}

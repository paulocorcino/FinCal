"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { rendaLiquidaSchema } from "@/lib/renda-liquida-schema";
import {
  createRendaLiquida,
  getRendaLiquidaVigente,
} from "@/lib/renda-liquida";

export type RendaLiquidaActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createRendaLiquidaAction(
  formData: FormData,
): Promise<RendaLiquidaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const raw = Object.fromEntries(formData);
  const parsed = rendaLiquidaSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    await createRendaLiquida(session.user.id, parsed.data);
    revalidatePath("/dashboard/diagnostico");
    return { success: true };
  } catch (e) {
    console.error("createRendaLiquidaAction failed:", e);
    const message = e instanceof Error ? e.message : "Erro ao salvar renda líquida";
    return { success: false, error: message };
  }
}

export async function getRendaLiquidaVigenteAction(mes: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return getRendaLiquidaVigente(session.user.id, mes);
}

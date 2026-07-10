"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { transferenciaSchema } from "@/lib/transferencia-schema";
import {
  createTransferencia,
  deleteTransferencia,
} from "@/lib/transferencias";

export type TransferenciaActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createTransferenciaAction(
  formData: FormData,
): Promise<TransferenciaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const parsed = transferenciaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    await createTransferencia(session.user.id, parsed.data);
    revalidatePath("/dashboard/transferencias");
    return { success: true };
  } catch (e) {
    console.error("createTransferenciaAction failed:", e);
    const message = e instanceof Error ? e.message : "Erro ao criar transferência";
    return { success: false, error: message };
  }
}

export async function deleteTransferenciaAction(
  transferenciaId: string,
): Promise<TransferenciaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  try {
    await deleteTransferencia(session.user.id, transferenciaId);
    revalidatePath("/dashboard/transferencias");
    return { success: true };
  } catch (e) {
    console.error("deleteTransferenciaAction failed:", e);
    return { success: false, error: "Erro ao excluir transferência" };
  }
}

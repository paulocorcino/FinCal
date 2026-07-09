"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { contaSchema } from "@/lib/conta-schema";
import {
  createConta,
  updateConta,
  deleteConta,
  getContasByUser,
  type ContaInput,
} from "@/lib/contas";

export type ContaActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createContaAction(
  formData: FormData,
): Promise<ContaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const parsed = contaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const data: ContaInput = {
    nome: parsed.data.nome,
    saldoInicial: parsed.data.saldoInicial,
    papel: parsed.data.papel,
  };

  try {
    await createConta(session.user.id, data);
    revalidatePath("/dashboard/contas");
    return { success: true };
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { success: false, error: "Já existe uma conta com este nome" };
    }
    console.error("createContaAction failed:", e);
    return { success: false, error: "Erro ao criar conta" };
  }
}

export async function updateContaAction(
  id: string,
  formData: FormData,
): Promise<ContaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const parsed = contaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const data: ContaInput = {
    nome: parsed.data.nome,
    saldoInicial: parsed.data.saldoInicial,
    papel: parsed.data.papel,
  };

  try {
    await updateConta(session.user.id, id, data);
    revalidatePath("/dashboard/contas");
    return { success: true };
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { success: false, error: "Já existe uma conta com este nome" };
    }
    console.error("updateContaAction failed:", e);
    return { success: false, error: "Erro ao atualizar conta" };
  }
}

export async function deleteContaAction(
  id: string,
): Promise<ContaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  try {
    await deleteConta(session.user.id, id);
    revalidatePath("/dashboard/contas");
    return { success: true };
  } catch (e) {
    console.error("deleteContaAction failed:", e);
    return { success: false, error: "Erro ao excluir conta" };
  }
}

export async function getContasByUserAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }
  return getContasByUser(session.user.id);
}

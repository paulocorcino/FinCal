"use server";

import { revalidatePath } from "next/cache";
import { StatusLancamento } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  lancamentoSchema,
  efetivarLancamentoSchema,
  lancamentoFiltersSchema,
} from "@/lib/lancamento-schema";
import {
  createLancamento,
  updateLancamento,
  deleteLancamento,
  getLancamentosByUser,
  efetivarLancamento,
  parseDataLancamento,
  type LancamentoInput,
} from "@/lib/lancamentos";
import type { LancamentoFilters } from "@/lib/lancamento-schema";

export type LancamentoActionResult =
  | { success: true }
  | { success: false; error: string };

function mapInput(parsed: {
  tipo: "RECEITA" | "DESPESA";
  valor: number;
  data: string;
  contaId: string;
  categoriaId: string;
  status?: StatusLancamento;
}): LancamentoInput {
  return {
    tipo: parsed.tipo,
    valor: parsed.valor,
    data: parseDataLancamento(parsed.data),
    contaId: parsed.contaId,
    categoriaId: parsed.categoriaId,
    status: parsed.status,
  };
}

export async function createLancamentoAction(
  formData: FormData,
): Promise<LancamentoActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const parsed = lancamentoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    await createLancamento(session.user.id, mapInput(parsed.data));
    revalidatePath("/dashboard/lancamentos");
    return { success: true };
  } catch (e) {
    console.error("createLancamentoAction failed:", e);
    const message = e instanceof Error ? e.message : "Erro ao criar lançamento";
    return { success: false, error: message };
  }
}

export async function updateLancamentoAction(
  id: string,
  formData: FormData,
): Promise<LancamentoActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const parsed = lancamentoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    await updateLancamento(session.user.id, id, mapInput(parsed.data));
    revalidatePath("/dashboard/lancamentos");
    return { success: true };
  } catch (e) {
    console.error("updateLancamentoAction failed:", e);
    const message =
      e instanceof Error ? e.message : "Erro ao atualizar lançamento";
    return { success: false, error: message };
  }
}

export async function deleteLancamentoAction(
  id: string,
): Promise<LancamentoActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  try {
    await deleteLancamento(session.user.id, id);
    revalidatePath("/dashboard/lancamentos");
    return { success: true };
  } catch (e) {
    console.error("deleteLancamentoAction failed:", e);
    return { success: false, error: "Erro ao excluir lançamento" };
  }
}

export async function efetivarLancamentoAction(
  id: string,
  formData: FormData,
): Promise<LancamentoActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const rawValor = formData.get("valor");
  const payload =
    rawValor === "" || rawValor === null
      ? {}
      : { valor: rawValor };

  const parsed = efetivarLancamentoSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    await efetivarLancamento(
      session.user.id,
      id,
      parsed.data.valor,
    );
    revalidatePath("/dashboard/lancamentos");
    return { success: true };
  } catch (e) {
    console.error("efetivarLancamentoAction failed:", e);
    const message =
      e instanceof Error ? e.message : "Erro ao efetivar lançamento";
    return { success: false, error: message };
  }
}

export async function getLancamentosByUserAction(filters: LancamentoFilters) {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const parsed = lancamentoFiltersSchema.safeParse(filters);
  if (!parsed.success) {
    return [];
  }

  return getLancamentosByUser(session.user.id, parsed.data);
}

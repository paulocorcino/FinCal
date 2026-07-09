"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  recorrenciaSchema,
  ocorrenciaEditSchema,
} from "@/lib/recorrencia-schema";
import {
  createRecorrencia,
  updateRecorrencia,
  deleteRecorrencia,
  editarOcorrenciaSomenteEsta,
  editarOcorrenciaEFuturas,
  excluirOcorrenciaSomenteEsta,
  excluirOcorrenciaEFuturas,
  getRecorrenciasByUser,
  materializarRecorrencias,
  type RecorrenciaInput,
} from "@/lib/recorrencias";
import type { OcorrenciaEditData } from "@/lib/recorrencia-schema";

export type RecorrenciaActionResult =
  | { success: true }
  | { success: false; error: string };

function mapInput(parsed: {
  tipo: "RECEITA" | "DESPESA";
  valor: number;
  dataInicio: string;
  dataFim?: string;
  frequencia: "MENSAL" | "SEMANAL";
  dia: number;
  contaId: string;
  categoriaId: string;
}): RecorrenciaInput {
  return {
    tipo: parsed.tipo,
    valor: parsed.valor,
    dataInicio: parsed.dataInicio,
    dataFim: parsed.dataFim,
    frequencia: parsed.frequencia,
    dia: parsed.dia,
    contaId: parsed.contaId,
    categoriaId: parsed.categoriaId,
  };
}

export async function createRecorrenciaAction(
  formData: FormData,
): Promise<RecorrenciaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const parsed = recorrenciaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    await createRecorrencia(session.user.id, mapInput(parsed.data));
    revalidatePath("/dashboard/recorrencias");
    return { success: true };
  } catch (e) {
    console.error("createRecorrenciaAction failed:", e);
    const message = e instanceof Error ? e.message : "Erro ao criar recorrência";
    return { success: false, error: message };
  }
}

export async function updateRecorrenciaAction(
  id: string,
  formData: FormData,
): Promise<RecorrenciaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const parsed = recorrenciaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    await updateRecorrencia(session.user.id, id, mapInput(parsed.data));
    revalidatePath("/dashboard/recorrencias");
    return { success: true };
  } catch (e) {
    console.error("updateRecorrenciaAction failed:", e);
    const message = e instanceof Error ? e.message : "Erro ao atualizar recorrência";
    return { success: false, error: message };
  }
}

export async function deleteRecorrenciaAction(
  id: string,
): Promise<RecorrenciaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  try {
    await deleteRecorrencia(session.user.id, id);
    revalidatePath("/dashboard/recorrencias");
    return { success: true };
  } catch (e) {
    console.error("deleteRecorrenciaAction failed:", e);
    return { success: false, error: "Erro ao excluir recorrência" };
  }
}

export async function getRecorrenciasByUserAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }
  return getRecorrenciasByUser(session.user.id);
}

export async function materializarRecorrenciasAction(range: {
  start?: string;
  end: string;
  contaId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  await materializarRecorrencias(session.user.id, range);
}

export async function editarOcorrenciaAction(
  lancamentoId: string,
  formData: FormData,
): Promise<RecorrenciaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const raw = Object.fromEntries(formData);
  const parsed = ocorrenciaEditSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    const data = parsed.data;
    if (data.escopo === "SOMENTE_ESTA") {
      await editarOcorrenciaSomenteEsta(session.user.id, lancamentoId, data);
    } else {
      await editarOcorrenciaEFuturas(session.user.id, lancamentoId, data);
    }
    revalidatePath("/dashboard/lancamentos");
    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (e) {
    console.error("editarOcorrenciaAction failed:", e);
    const message = e instanceof Error ? e.message : "Erro ao editar ocorrência";
    return { success: false, error: message };
  }
}

export async function excluirOcorrenciaAction(
  lancamentoId: string,
  formData: FormData,
): Promise<RecorrenciaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const escopo = formData.get("escopo") as OcorrenciaEditData["escopo"] | null;
  if (!escopo || (escopo !== "SOMENTE_ESTA" && escopo !== "ESTA_E_FUTURAS")) {
    return { success: false, error: "Escopo inválido" };
  }

  try {
    if (escopo === "SOMENTE_ESTA") {
      await excluirOcorrenciaSomenteEsta(session.user.id, lancamentoId);
    } else {
      await excluirOcorrenciaEFuturas(session.user.id, lancamentoId);
    }
    revalidatePath("/dashboard/lancamentos");
    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (e) {
    console.error("excluirOcorrenciaAction failed:", e);
    const message = e instanceof Error ? e.message : "Erro ao excluir ocorrência";
    return { success: false, error: message };
  }
}

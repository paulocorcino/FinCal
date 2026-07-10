"use server";

import { revalidatePath } from "next/cache";
import { StatusLancamento } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createLancamento,
  getLancamentosByUser,
  parseDataLancamento,
} from "@/lib/lancamentos";
import { getCategoriesByUser } from "@/lib/categories";
import {
  extractTextFromBuffer,
  extrairCandidatos,
  detectarDuplicados,
  type Candidato,
} from "@/lib/importacao";
import {
  uploadImportacaoSchema,
  confirmacaoSchema,
} from "@/lib/importacao-schema";

export type ExtrairCandidatosResult =
  | { success: true; candidatos: Candidato[] }
  | { success: false; error: string };

export type ConfirmarImportacaoResult =
  | { success: true; count: number }
  | { success: false; error: string };

export async function extrairCandidatosAction(
  formData: FormData,
): Promise<ExtrairCandidatosResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const userId = session.user.id;

  const parsed = uploadImportacaoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { contaId } = parsed.data;

  const conta = await prisma.conta.findFirst({
    where: { id: contaId, userId },
  });
  if (!conta) {
    return { success: false, error: "Conta não encontrada" };
  }

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File)) {
    return { success: false, error: "Arquivo inválido" };
  }

  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const texto = await extractTextFromBuffer(
      buffer,
      arquivo.type,
      arquivo.name,
    );

    const categorias = await getCategoriesByUser(userId);
    const candidatos = await extrairCandidatos(texto, categorias);

    const lancamentos = await getLancamentosByUser(userId, { contaId });
    const candidatosComDuplicados = detectarDuplicados(
      candidatos,
      lancamentos,
      contaId,
    );

    return { success: true, candidatos: candidatosComDuplicados };
  } catch (e) {
    console.error("extrairCandidatosAction failed:", e);
    const message =
      e instanceof Error ? e.message : "Erro ao extrair candidatos";
    return { success: false, error: message };
  }
}

export async function confirmarImportacaoAction(
  formData: FormData,
): Promise<ConfirmarImportacaoResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const userId = session.user.id;

  const rawContaId = formData.get("contaId");
  const rawCandidatos = formData.get("candidatos");

  if (typeof rawContaId !== "string" || typeof rawCandidatos !== "string") {
    return { success: false, error: "Dados incompletos" };
  }

  let parsedCandidatos: unknown;
  try {
    parsedCandidatos = JSON.parse(rawCandidatos);
  } catch {
    return { success: false, error: "Candidatos inválidos" };
  }

  const parsed = confirmacaoSchema.safeParse({
    contaId: rawContaId,
    candidatos: parsedCandidatos,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { contaId, candidatos } = parsed.data;

  const conta = await prisma.conta.findFirst({
    where: { id: contaId, userId },
  });
  if (!conta) {
    return { success: false, error: "Conta não encontrada" };
  }

  const selecionados = candidatos.filter((c) => c.selecionado);

  try {
    for (const candidato of selecionados) {
      await createLancamento(userId, {
        tipo: candidato.tipo,
        valor: candidato.valor,
        data: parseDataLancamento(candidato.data),
        contaId,
        categoriaId: candidato.categoriaId,
        status: StatusLancamento.EFETIVADO,
      });
    }

    revalidatePath("/dashboard/lancamentos");
    revalidatePath("/dashboard/importacao");

    return { success: true, count: selecionados.length };
  } catch (e) {
    console.error("confirmarImportacaoAction failed:", e);
    const message =
      e instanceof Error ? e.message : "Erro ao confirmar importação";
    return { success: false, error: message };
  }
}

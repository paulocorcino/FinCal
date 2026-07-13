"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  isStatusLancamento,
  isTipoLancamento,
  statusDefaultPorData,
  type StatusLancamento,
  type TipoLancamento,
} from "@/lib/lancamento";
import { hojeAmericaSaoPaulo, isDataValida } from "@/lib/data";
import { inicioFimMesISO } from "@/lib/agenda";

export type LancamentoRow = {
  id: string;
  userId: string;
  contaId: string;
  categoriaId: string;
  tipo: string;
  valor: number;
  data: string;
  status: string;
  recorrenciaId: string | null;
  transferenciaId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LancamentoActionState = { error?: string } | undefined;

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Não autenticado.");
  return userId;
}

function lerValorInteiro(formData: FormData): number | null {
  const raw = formData.get("valor");
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isSafeInteger(n)) return null;
  return n;
}

export async function listarLancamentos(): Promise<LancamentoRow[]> {
  const userId = await requireUserId();
  return prisma.lancamento.findMany({
    where: { userId },
    orderBy: { data: "asc" },
  });
}

export async function listarLancamentosDaAgenda(opts: {
  mesAno: string;
  contaId?: string;
}): Promise<LancamentoRow[]> {
  const userId = await requireUserId();
  const { inicio, fim } = inicioFimMesISO(opts.mesAno);
  return prisma.lancamento.findMany({
    where: {
      userId,
      data: { gte: inicio, lte: fim },
      ...(opts.contaId ? { contaId: opts.contaId } : {}),
    },
    orderBy: { data: "asc" },
  });
}

export async function criarLancamento(
  _prev: LancamentoActionState,
  formData: FormData
): Promise<LancamentoActionState> {
  const userId = await requireUserId();
  const tipoRaw = String(formData.get("tipo") ?? "");
  const dataRaw = String(formData.get("data") ?? "").trim();
  const contaId = String(formData.get("contaId") ?? "");
  const categoriaId = String(formData.get("categoriaId") ?? "");

  if (!isTipoLancamento(tipoRaw)) {
    return { error: "Tipo inválido." };
  }
  const tipo: TipoLancamento = tipoRaw;

  const valor = lerValorInteiro(formData);
  if (valor === null) {
    return { error: "Valor inválido." };
  }

  if (!isDataValida(dataRaw)) {
    return { error: "Data inválida." };
  }

  const conta = await prisma.conta.findFirst({
    where: { id: contaId, userId },
    select: { id: true },
  });
  if (!conta) {
    return { error: "Conta não encontrada." };
  }

  const categoria = await prisma.categoria.findFirst({
    where: { id: categoriaId, userId },
    select: { id: true, tipo: true },
  });
  if (!categoria) {
    return { error: "Categoria não encontrada." };
  }
  if (categoria.tipo !== tipo) {
    return { error: "Categoria não corresponde ao tipo do Lançamento." };
  }

  const statusRaw = String(formData.get("status") ?? "");
  const status: StatusLancamento = isStatusLancamento(statusRaw)
    ? statusRaw
    : statusDefaultPorData(dataRaw, hojeAmericaSaoPaulo());

  await prisma.lancamento.create({
    data: { userId, contaId, categoriaId, tipo, valor, data: dataRaw, status },
  });
}

export async function editarLancamento(
  _prev: LancamentoActionState,
  formData: FormData
): Promise<LancamentoActionState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const tipoRaw = String(formData.get("tipo") ?? "");
  const dataRaw = String(formData.get("data") ?? "").trim();
  const contaId = String(formData.get("contaId") ?? "");
  const categoriaId = String(formData.get("categoriaId") ?? "");

  if (!id) {
    return { error: "Lançamento inválido." };
  }
  if (!isTipoLancamento(tipoRaw)) {
    return { error: "Tipo inválido." };
  }
  const tipo: TipoLancamento = tipoRaw;

  const valor = lerValorInteiro(formData);
  if (valor === null) {
    return { error: "Valor inválido." };
  }

  if (!isDataValida(dataRaw)) {
    return { error: "Data inválida." };
  }

  const conta = await prisma.conta.findFirst({
    where: { id: contaId, userId },
    select: { id: true },
  });
  if (!conta) {
    return { error: "Conta não encontrada." };
  }

  const categoria = await prisma.categoria.findFirst({
    where: { id: categoriaId, userId },
    select: { id: true, tipo: true },
  });
  if (!categoria) {
    return { error: "Categoria não encontrada." };
  }
  if (categoria.tipo !== tipo) {
    return { error: "Categoria não corresponde ao tipo do Lançamento." };
  }

  const statusRaw = String(formData.get("status") ?? "");
  const status: StatusLancamento = isStatusLancamento(statusRaw)
    ? statusRaw
    : statusDefaultPorData(dataRaw, hojeAmericaSaoPaulo());

  const result = await prisma.lancamento.updateMany({
    where: { id, userId },
    data: { contaId, categoriaId, tipo, valor, data: dataRaw, status },
  });

  if (result.count === 0) {
    return { error: "Lançamento não encontrado." };
  }
}

export async function excluirLancamento(
  _prev: LancamentoActionState,
  formData: FormData
): Promise<LancamentoActionState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Lançamento inválido." };
  }

  const result = await prisma.lancamento.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) {
    return { error: "Lançamento não encontrado." };
  }
}

export async function efetivarLancamento(
  _prev: LancamentoActionState,
  formData: FormData
): Promise<LancamentoActionState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Lançamento inválido." };
  }

  const valorRaw = formData.get("valor");
  let valorAjustado: number | undefined;
  if (typeof valorRaw === "string" && valorRaw.trim() !== "") {
    const parsed = lerValorInteiro(formData);
    if (parsed === null) {
      return { error: "Valor inválido." };
    }
    valorAjustado = parsed;
  }

  const result = await prisma.lancamento.updateMany({
    where: { id, userId, status: "PENDENTE" },
    data: {
      status: "EFETIVADO",
      ...(valorAjustado !== undefined && { valor: valorAjustado }),
    },
  });

  if (result.count > 0) return;

  const existente = await prisma.lancamento.findFirst({
    where: { id, userId },
    select: { status: true },
  });
  if (!existente) {
    return { error: "Lançamento não encontrado." };
  }
  if (existente.status === "EFETIVADO") {
    return { error: "Lançamento já efetivado." };
  }
  return { error: "Lançamento não encontrado." };
}

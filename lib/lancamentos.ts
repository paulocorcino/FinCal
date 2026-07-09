import { prisma } from "@/lib/prisma";
import {
  StatusLancamento,
  TipoLancamento,
  type Lancamento,
} from "@prisma/client";
import type { LancamentoFilters } from "@/lib/lancamento-schema";

export type LancamentoInput = {
  tipo: TipoLancamento;
  valor: number;
  data: Date;
  contaId: string;
  categoriaId: string;
};

const SP_TIME_ZONE = "America/Sao_Paulo";

function saoPauloOffsetMs(referenceDate: Date): number {
  const utc = new Date(
    referenceDate.toLocaleString("en-US", { timeZone: "UTC" }),
  );
  const sp = new Date(
    referenceDate.toLocaleString("en-US", { timeZone: SP_TIME_ZONE }),
  );
  return utc.getTime() - sp.getTime();
}

export function parseDataLancamento(
  dataStr: string,
  referenceDate = new Date(),
): Date {
  const [year, month, day] = dataStr.split("-").map(Number);
  const offsetMs = saoPauloOffsetMs(referenceDate);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) + offsetMs);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function isAtrasado(
  lancamento: { status: StatusLancamento; data: Date },
  now = new Date(),
): boolean {
  if (lancamento.status !== StatusLancamento.PENDENTE) return false;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: SP_TIME_ZONE,
  });
  const dataStr = formatter.format(lancamento.data);
  const hojeStr = formatter.format(now);
  return dataStr < hojeStr;
}

async function validateCategoriaCompativel(
  userId: string,
  categoriaId: string,
  tipo: TipoLancamento,
) {
  const categoria = await prisma.categoria.findFirst({
    where: { id: categoriaId, userId },
  });
  if (!categoria) {
    throw new Error("Categoria não encontrada");
  }
  if (categoria.tipo !== tipo) {
    throw new Error("Categoria incompatível com o tipo do lançamento");
  }
}

async function validateContaOwnership(userId: string, contaId: string) {
  const conta = await prisma.conta.findFirst({
    where: { id: contaId, userId },
  });
  if (!conta) {
    throw new Error("Conta não encontrada");
  }
}

export async function createLancamento(
  userId: string,
  data: LancamentoInput,
) {
  await validateContaOwnership(userId, data.contaId);
  await validateCategoriaCompativel(userId, data.categoriaId, data.tipo);

  return prisma.lancamento.create({
    data: {
      ...data,
      userId,
      status: StatusLancamento.PENDENTE,
    },
  });
}

export async function updateLancamento(
  userId: string,
  id: string,
  data: LancamentoInput,
) {
  await validateContaOwnership(userId, data.contaId);
  await validateCategoriaCompativel(userId, data.categoriaId, data.tipo);

  return prisma.lancamento.update({
    where: { id, userId },
    data,
  });
}

export async function deleteLancamento(userId: string, id: string) {
  return prisma.lancamento.delete({
    where: { id, userId },
  });
}

export async function getLancamentosByUser(
  userId: string,
  filters: LancamentoFilters = {},
) {
  const where: {
    userId: string;
    data?: { gte?: Date; lt?: Date };
    contaId?: string;
    status?: StatusLancamento;
  } = { userId };

  if (filters.start) {
    where.data = { gte: parseDataLancamento(filters.start) };
  }

  if (filters.end) {
    const endExclusive = addDays(parseDataLancamento(filters.end), 1);
    where.data = { ...where.data, lt: endExclusive };
  }

  if (filters.contaId) {
    where.contaId = filters.contaId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.lancamento.findMany({
    where,
    orderBy: { data: "asc" },
    include: { conta: true, categoria: true },
  });
}

export async function efetivarLancamento(
  userId: string,
  id: string,
  valor?: number,
) {
  const lancamento = await prisma.lancamento.findFirst({
    where: { id, userId },
  });
  if (!lancamento) {
    throw new Error("Lançamento não encontrado");
  }
  if (lancamento.status !== StatusLancamento.PENDENTE) {
    throw new Error("Apenas lançamentos pendentes podem ser efetivados");
  }

  return prisma.lancamento.update({
    where: { id, userId },
    data: {
      status: StatusLancamento.EFETIVADO,
      ...(valor !== undefined && { valor }),
    },
  });
}

export async function getLancamentoById(userId: string, id: string) {
  return prisma.lancamento.findFirst({
    where: { id, userId },
    include: { conta: true, categoria: true },
  });
}

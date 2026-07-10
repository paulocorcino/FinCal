import { prisma } from "@/lib/prisma";
import {
  FrequenciaRecorrencia,
  StatusLancamento,
  TipoLancamento,
  type Recorrencia,
} from "@prisma/client";
import { parseDataLancamento, addDays } from "@/lib/lancamentos";
import { toSPDateString, addDaysSP } from "@/lib/saldo";
import type { RecorrenciaFormData, OcorrenciaEditData } from "@/lib/recorrencia-schema";

export type RecorrenciaInput = RecorrenciaFormData;

export type MaterializarRange = {
  start?: string;
  end: string;
  contaId?: string;
};

function lastDayOfMonthSP(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function gerarOcorrencias(
  recorrencia: Pick<
    Recorrencia,
    "frequencia" | "dia" | "dataInicio" | "dataFim"
  >,
  rangeStartStr: string,
  rangeEndStr: string,
): string[] {
  const fim = recorrencia.dataFim && recorrencia.dataFim < rangeEndStr
    ? recorrencia.dataFim
    : rangeEndStr;

  if (recorrencia.dataInicio > fim) return [];

  const inicio = recorrencia.dataInicio > rangeStartStr
    ? recorrencia.dataInicio
    : rangeStartStr;

  if (inicio > fim) return [];

  if (recorrencia.frequencia === FrequenciaRecorrencia.MENSAL) {
    return gerarMensal(recorrencia.dia, inicio, fim);
  }
  return gerarSemanal(recorrencia.dia, recorrencia.dataInicio, inicio, fim);
}

function gerarMensal(dia: number, inicio: string, fim: string): string[] {
  const datas: string[] = [];
  const [startYear, startMonth] = inicio.split("-").map(Number);
  const [endYear, endMonth] = fim.split("-").map(Number);

  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const lastDay = lastDayOfMonthSP(year, month);
    const day = Math.min(dia, lastDay);
    const data = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (data >= inicio && data <= fim) {
      datas.push(data);
    }

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return datas;
}

function gerarSemanal(
  dia: number,
  dataInicio: string,
  inicio: string,
  fim: string,
): string[] {
  const datas: string[] = [];
  let cursor = parseDataLancamento(dataInicio);

  // advance to the first date that matches the requested weekday
  while (cursor.getUTCDay() !== dia) {
    cursor = addDays(cursor, 1);
  }

  let cursorStr = toSPDateString(cursor);
  if (cursorStr < dataInicio) {
    cursor = addDays(cursor, 7);
    cursorStr = toSPDateString(cursor);
  }

  while (cursorStr <= fim) {
    if (cursorStr >= inicio) {
      datas.push(cursorStr);
    }
    cursor = addDays(cursor, 7);
    cursorStr = toSPDateString(cursor);
  }

  return datas;
}

async function validateContaOwnership(userId: string, contaId: string) {
  const conta = await prisma.conta.findFirst({
    where: { id: contaId, userId },
  });
  if (!conta) {
    throw new Error("Conta não encontrada");
  }
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

export async function createRecorrencia(
  userId: string,
  data: RecorrenciaInput,
) {
  await validateContaOwnership(userId, data.contaId);
  await validateCategoriaCompativel(userId, data.categoriaId, data.tipo);

  return prisma.recorrencia.create({
    data: {
      ...data,
      userId,
    },
  });
}

export async function updateRecorrencia(
  userId: string,
  id: string,
  data: RecorrenciaInput,
) {
  await validateContaOwnership(userId, data.contaId);
  await validateCategoriaCompativel(userId, data.categoriaId, data.tipo);

  return prisma.recorrencia.update({
    where: { id, userId },
    data,
  });
}

export async function deleteRecorrencia(userId: string, id: string) {
  return prisma.recorrencia.delete({
    where: { id, userId },
  });
}

export async function getRecorrenciasByUser(userId: string) {
  return prisma.recorrencia.findMany({
    where: { userId },
    include: { conta: true, categoria: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecorrenciaById(userId: string, id: string) {
  return prisma.recorrencia.findFirst({
    where: { id, userId },
    include: { conta: true, categoria: true },
  });
}

export async function materializarRecorrencias(
  userId: string,
  range: MaterializarRange,
) {
  const start = range.start ?? "1970-01-01";
  const end = range.end;

  const where: { userId: string; contaId?: string } = { userId };
  if (range.contaId) {
    where.contaId = range.contaId;
  }

  const recorrencias = await prisma.recorrencia.findMany({
    where,
    include: { excecoes: true },
  });

  const excecaoSet = new Set(
    recorrencias.flatMap((r) => r.excecoes.map((e) => `${r.id}:${e.data}`)),
  );

  const lancamentosExistentes = await prisma.lancamento.findMany({
    where: {
      userId,
      recorrenciaId: { not: null },
      ...(range.contaId ? { contaId: range.contaId } : {}),
    },
    select: { recorrenciaId: true, data: true, modificado: true },
  });

  const chave = (recorrenciaId: string | null, data: Date) =>
    `${recorrenciaId}:${toSPDateString(data)}`;

  const existentes = new Set(
    lancamentosExistentes.map((l) => chave(l.recorrenciaId, l.data)),
  );

  for (const recorrencia of recorrencias) {
    const datas = gerarOcorrencias(recorrencia, start, end);

    for (const dataStr of datas) {
      if (excecaoSet.has(`${recorrencia.id}:${dataStr}`)) continue;
      if (existentes.has(chave(recorrencia.id, parseDataLancamento(dataStr)))) {
        continue;
      }

      await prisma.lancamento.create({
        data: {
          tipo: recorrencia.tipo,
          valor: recorrencia.valor,
          data: parseDataLancamento(dataStr),
          status: StatusLancamento.PENDENTE,
          userId,
          contaId: recorrencia.contaId,
          categoriaId: recorrencia.categoriaId,
          recorrenciaId: recorrencia.id,
        },
      });
      existentes.add(chave(recorrencia.id, parseDataLancamento(dataStr)));
    }
  }
}

function hojeSP(): string {
  return toSPDateString(new Date());
}

export async function editarOcorrenciaSomenteEsta(
  userId: string,
  lancamentoId: string,
  data: OcorrenciaEditData,
) {
  const lancamento = await prisma.lancamento.findFirst({
    where: { id: lancamentoId, userId },
  });
  if (!lancamento) {
    throw new Error("Lançamento não encontrado");
  }

  if (data.contaId) await validateContaOwnership(userId, data.contaId);
  if (data.categoriaId) {
    await validateCategoriaCompativel(
      userId,
      data.categoriaId,
      data.tipo ?? lancamento.tipo,
    );
  }

  return prisma.lancamento.update({
    where: { id: lancamentoId, userId },
    data: {
      ...(data.tipo && { tipo: data.tipo }),
      ...(data.valor !== undefined && { valor: data.valor }),
      ...(data.data && { data: parseDataLancamento(data.data) }),
      ...(data.contaId && { contaId: data.contaId }),
      ...(data.categoriaId && { categoriaId: data.categoriaId }),
      modificado: true,
    },
  });
}

export async function editarOcorrenciaEFuturas(
  userId: string,
  lancamentoId: string,
  data: OcorrenciaEditData,
) {
  const lancamento = await prisma.lancamento.findFirst({
    where: { id: lancamentoId, userId },
    include: { recorrencia: true },
  });
  if (!lancamento || !lancamento.recorrencia) {
    throw new Error("Lançamento recorrente não encontrado");
  }

  const dataOcorrenciaStr = toSPDateString(lancamento.data);
  if (dataOcorrenciaStr < hojeSP()) {
    throw new Error("Não é permitida edição retroativa");
  }

  const recorrencia = lancamento.recorrencia;
  if (data.contaId) await validateContaOwnership(userId, data.contaId);
  if (data.categoriaId) {
    await validateCategoriaCompativel(
      userId,
      data.categoriaId,
      data.tipo ?? recorrencia.tipo,
    );
  }

  await prisma.recorrencia.update({
    where: { id: recorrencia.id, userId },
    data: {
      ...(data.tipo && { tipo: data.tipo }),
      ...(data.valor !== undefined && { valor: data.valor }),
      ...(data.contaId && { contaId: data.contaId }),
      ...(data.categoriaId && { categoriaId: data.categoriaId }),
    },
  });

  await prisma.lancamento.deleteMany({
    where: {
      recorrenciaId: recorrencia.id,
      userId,
      modificado: false,
      data: { gte: parseDataLancamento(dataOcorrenciaStr) },
    },
  });
}

export async function excluirOcorrenciaSomenteEsta(
  userId: string,
  lancamentoId: string,
) {
  const lancamento = await prisma.lancamento.findFirst({
    where: { id: lancamentoId, userId },
  });
  if (!lancamento || !lancamento.recorrenciaId) {
    throw new Error("Lançamento recorrente não encontrado");
  }

  const dataStr = toSPDateString(lancamento.data);

  await prisma.$transaction([
    prisma.recorrenciaExcecao.upsert({
      where: {
        recorrenciaId_data: {
          recorrenciaId: lancamento.recorrenciaId,
          data: dataStr,
        },
      },
      create: {
        recorrenciaId: lancamento.recorrenciaId,
        data: dataStr,
      },
      update: {},
    }),
    prisma.lancamento.delete({
      where: { id: lancamentoId, userId },
    }),
  ]);
}

export async function excluirOcorrenciaEFuturas(
  userId: string,
  lancamentoId: string,
) {
  const lancamento = await prisma.lancamento.findFirst({
    where: { id: lancamentoId, userId },
    include: { recorrencia: true },
  });
  if (!lancamento || !lancamento.recorrencia) {
    throw new Error("Lançamento recorrente não encontrado");
  }

  const dataOcorrenciaStr = toSPDateString(lancamento.data);
  if (dataOcorrenciaStr < hojeSP()) {
    throw new Error("Não é permitida exclusão retroativa");
  }

  const novaDataFim = addDaysSP(dataOcorrenciaStr, -1);
  const recorrencia = lancamento.recorrencia;

  await prisma.$transaction([
    prisma.recorrencia.update({
      where: { id: recorrencia.id, userId },
      data: {
        dataFim: novaDataFim < recorrencia.dataInicio
          ? recorrencia.dataInicio
          : novaDataFim,
      },
    }),
    prisma.lancamento.deleteMany({
      where: {
        recorrenciaId: recorrencia.id,
        userId,
        modificado: false,
        data: { gte: parseDataLancamento(dataOcorrenciaStr) },
      },
    }),
  ]);
}

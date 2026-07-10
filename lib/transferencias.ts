import { prisma } from "@/lib/prisma";
import { StatusLancamento, TipoLancamento } from "@prisma/client";
import { parseDataLancamento } from "@/lib/lancamentos";
import type { TransferenciaFormData } from "@/lib/transferencia-schema";

export type TransferenciaView = {
  transferenciaId: string;
  data: Date;
  valor: number;
  origem: { id: string; nome: string };
  destino: { id: string; nome: string };
};

async function validateContaOwnership(userId: string, contaId: string) {
  const conta = await prisma.conta.findFirst({
    where: { id: contaId, userId },
  });
  if (!conta) {
    throw new Error("Conta não encontrada");
  }
  return conta;
}

export async function createTransferencia(
  userId: string,
  input: TransferenciaFormData,
) {
  if (input.origemId === input.destinoId) {
    throw new Error("Contas de origem e destino devem ser diferentes");
  }

  const [origem, destino] = await Promise.all([
    validateContaOwnership(userId, input.origemId),
    validateContaOwnership(userId, input.destinoId),
  ]);

  const transferenciaId = crypto.randomUUID();
  const data = parseDataLancamento(input.data);

  await prisma.lancamento.createMany({
    data: [
      {
        tipo: TipoLancamento.DESPESA,
        valor: input.valor,
        data,
        status: StatusLancamento.EFETIVADO,
        userId,
        contaId: origem.id,
        categoriaId: null,
        transferenciaId,
      },
      {
        tipo: TipoLancamento.RECEITA,
        valor: input.valor,
        data,
        status: StatusLancamento.EFETIVADO,
        userId,
        contaId: destino.id,
        categoriaId: null,
        transferenciaId,
      },
    ],
  });

  return transferenciaId;
}

export async function getTransferenciasByUser(
  userId: string,
): Promise<TransferenciaView[]> {
  const lancamentos = await prisma.lancamento.findMany({
    where: {
      userId,
      transferenciaId: { not: null },
    },
    include: { conta: true },
    orderBy: { data: "desc" },
  });

  const agrupados = new Map<string, TransferenciaView>();
  for (const l of lancamentos) {
    if (!l.transferenciaId) continue;

    const view = agrupados.get(l.transferenciaId) ?? {
      transferenciaId: l.transferenciaId,
      data: l.data,
      valor: l.valor,
      origem: { id: "", nome: "" },
      destino: { id: "", nome: "" },
    };

    const conta = { id: l.conta.id, nome: l.conta.nome };
    if (l.tipo === TipoLancamento.DESPESA) {
      view.origem = conta;
    } else {
      view.destino = conta;
    }

    agrupados.set(l.transferenciaId, view);
  }

  return Array.from(agrupados.values());
}

export async function deleteTransferencia(
  userId: string,
  transferenciaId: string,
) {
  await prisma.lancamento.deleteMany({
    where: { userId, transferenciaId },
  });
}

"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hojeAmericaSaoPaulo } from "@/lib/data";
import {
  calcularSaldoAtual,
  calcularSerieProjetada,
  primeiroDiaNegativo,
  fimDoMesAtual,
  type TipoLancamento,
  type PontoSerie,
} from "@/lib/saldo";

export type SerieSaldos = {
  atual: number;
  projetado: PontoSerie[];
  primeiroDiaNegativo: string | null;
  horizonte: string;
};

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Não autenticado.");
  return userId;
}

export async function obterSerieSaldos(opts?: {
  contaId?: string;
  horizonte?: string;
}): Promise<SerieSaldos | null> {
  const userId = await requireUserId();

  const contas = await prisma.conta.findMany({
    where: {
      userId,
      ...(opts?.contaId ? { id: opts.contaId } : {}),
    },
  });
  if (contas.length === 0) return null;

  const saldoInicial = contas.reduce((acc, c) => acc + c.saldoInicial, 0);

  const lancamentos = await prisma.lancamento.findMany({
    where: {
      userId,
      ...(opts?.contaId ? { contaId: opts.contaId } : {}),
    },
  });

  const hoje = hojeAmericaSaoPaulo();
  const horizonte = opts?.horizonte ?? fimDoMesAtual(hoje);

  const atual = calcularSaldoAtual(
    saldoInicial,
    lancamentos
      .filter((l) => l.status === "EFETIVADO" && l.data <= hoje)
      .map((l) => ({ valor: l.valor, tipo: l.tipo as TipoLancamento }))
  );

  const projetado = calcularSerieProjetada(
    saldoInicial,
    hoje,
    horizonte,
    lancamentos.map((l) => ({
      valor: l.valor,
      tipo: l.tipo as TipoLancamento,
      data: l.data,
    }))
  );

  return {
    atual,
    projetado,
    primeiroDiaNegativo: primeiroDiaNegativo(projetado),
    horizonte,
  };
}

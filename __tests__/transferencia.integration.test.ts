import { describe, expect, it } from "vitest";
import { signup } from "../app/actions/auth";
import { createConta } from "../lib/contas";
import { getCategoriesByUser } from "../lib/categories";
import { createLancamento, parseDataLancamento } from "../lib/lancamentos";
import {
  createTransferencia,
  deleteTransferencia,
} from "../lib/transferencias";
import { getSaldoForUser } from "../lib/saldo-service";
import { prisma } from "../lib/prisma";
import { StatusLancamento, TipoLancamento } from "@prisma/client";

async function createUserForm(email: string, password: string) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  return form;
}

function spDateStr(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

async function totalDoMes(
  userId: string,
  tipo: "RECEITA" | "DESPESA",
  dataRef: string,
) {
  const [ano, mes] = dataRef.split("-");
  const inicio = `${ano}-${mes}-01`;
  const fim = `${ano}-${mes}-31`;

  const result = await prisma.lancamento.aggregate({
    where: {
      userId,
      tipo,
      transferenciaId: null,
      data: {
        gte: parseDataLancamento(inicio),
        lte: parseDataLancamento(fim),
      },
    },
    _sum: { valor: true },
  });

  return result._sum.valor ?? 0;
}

describe("transferencia integration", () => {
  it("cria par neutro, move saldo entre contas e remove ao excluir", async () => {
    const email = "transferencia-user1@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();
    const userId = user!.id;

    const origem = await createConta(userId, {
      nome: "Conta Origem",
      saldoInicial: 10000,
      papel: "CORRENTE",
    });

    const destino = await createConta(userId, {
      nome: "Conta Destino",
      saldoInicial: 5000,
      papel: "CORRENTE",
    });

    const categoriaReceita = (await getCategoriesByUser(userId)).find(
      (c) => c.tipo === "RECEITA",
    )!;
    const categoriaDespesa = (await getCategoriesByUser(userId)).find(
      (c) => c.tipo === "DESPESA",
    )!;

    const hojeStr = spDateStr();
    const hoje = parseDataLancamento(hojeStr);

    await createLancamento(userId, {
      tipo: "DESPESA",
      valor: 1000,
      data: hoje,
      contaId: origem.id,
      categoriaId: categoriaDespesa.id,
    });

    await createLancamento(userId, {
      tipo: "RECEITA",
      valor: 2000,
      data: hoje,
      contaId: destino.id,
      categoriaId: categoriaReceita.id,
    });

    await prisma.lancamento.updateMany({
      where: { userId },
      data: { status: StatusLancamento.EFETIVADO },
    });

    const rendaLiquida = 100000;
    const despesaAntes = await totalDoMes(userId, "DESPESA", hojeStr);
    const receitaAntes = await totalDoMes(userId, "RECEITA", hojeStr);
    const taxaAntes = (receitaAntes - despesaAntes) / rendaLiquida;

    expect(despesaAntes).toBe(1000);
    expect(receitaAntes).toBe(2000);

    const saldoOrigemAntes = await getSaldoForUser(userId, {
      contaId: origem.id,
    });
    const saldoDestinoAntes = await getSaldoForUser(userId, {
      contaId: destino.id,
    });
    const saldoConsolidadoAntes = await getSaldoForUser(userId, {});

    expect(saldoOrigemAntes.saldoAtual).toBe(9000);
    expect(saldoDestinoAntes.saldoAtual).toBe(7000);
    expect(saldoConsolidadoAntes.saldoAtual).toBe(16000);

    const transferenciaId = await createTransferencia(userId, {
      origemId: origem.id,
      destinoId: destino.id,
      valor: 2500,
      data: hojeStr,
    });

    const par = await prisma.lancamento.findMany({
      where: { userId, transferenciaId },
    });

    expect(par).toHaveLength(2);
    expect(par.some((l) => l.tipo === TipoLancamento.DESPESA && l.contaId === origem.id)).toBe(true);
    expect(par.some((l) => l.tipo === TipoLancamento.RECEITA && l.contaId === destino.id)).toBe(true);
    expect(par.every((l) => l.valor === 2500)).toBe(true);
    expect(par.every((l) => l.status === StatusLancamento.EFETIVADO)).toBe(true);
    expect(par.every((l) => l.categoriaId === null)).toBe(true);

    const saldoOrigemDepois = await getSaldoForUser(userId, {
      contaId: origem.id,
    });
    const saldoDestinoDepois = await getSaldoForUser(userId, {
      contaId: destino.id,
    });
    const saldoConsolidadoDepois = await getSaldoForUser(userId, {});

    expect(saldoOrigemDepois.saldoAtual).toBe(6500);
    expect(saldoDestinoDepois.saldoAtual).toBe(9500);
    expect(saldoConsolidadoDepois.saldoAtual).toBe(16000);

    const despesaDepois = await totalDoMes(userId, "DESPESA", hojeStr);
    const receitaDepois = await totalDoMes(userId, "RECEITA", hojeStr);
    const taxaDepois = (receitaDepois - despesaDepois) / rendaLiquida;

    expect(despesaDepois).toBe(despesaAntes);
    expect(receitaDepois).toBe(receitaAntes);
    expect(taxaDepois).toBe(taxaAntes);

    await deleteTransferencia(userId, transferenciaId);

    const restantes = await prisma.lancamento.count({
      where: { userId, transferenciaId },
    });
    expect(restantes).toBe(0);
  });
});

import { describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { signup } from "../app/actions/auth";
import { createConta } from "../lib/contas";
import { getCategoriesByUser } from "../lib/categories";
import { getSaldoForUser } from "../lib/saldo-service";
import { prisma } from "../lib/prisma";
import {
  FrequenciaRecorrencia,
  StatusLancamento,
  TipoLancamento,
} from "@prisma/client";
import {
  createRecorrencia,
  materializarRecorrencias,
  editarOcorrenciaSomenteEsta,
  editarOcorrenciaEFuturas,
  gerarOcorrencias,
} from "../lib/recorrencias";
import { addDaysSP, toSPDateString } from "../lib/saldo";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

async function createUserForm(email: string, password: string) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  return form;
}

async function setupUser(email: string) {
  await signup(await createUserForm(email, "password123"));
  const user = await prisma.user.findUnique({ where: { email } });
  expect(user).not.toBeNull();
  return user!;
}

async function setupContaECategorias(userId: string) {
  const conta = await createConta(userId, {
    nome: "Conta Corrente",
    saldoInicial: 0,
    papel: "CORRENTE",
  });
  const categorias = await getCategoriesByUser(userId);
  const receita = categorias.find((c) => c.tipo === "RECEITA")!;
  const despesa = categorias.find((c) => c.tipo === "DESPESA")!;
  return { conta, receita, despesa };
}

function spDateStr(date = new Date()): string {
  return toSPDateString(date);
}

describe("recorrência", () => {
  it("cria recorrência e materializa ocorrências como Lançamentos com recorrenciaId", async () => {
    const email = "recorrencia-create@example.com";
    const user = await setupUser(email);
    const { conta, despesa } = await setupContaECategorias(user.id);

    const recorrencia = await createRecorrencia(user.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 1000,
      dataInicio: "2026-04-01",
      frequencia: FrequenciaRecorrencia.MENSAL,
      dia: 10,
      contaId: conta.id,
      categoriaId: despesa.id,
    });

    await materializarRecorrencias(user.id, {
      start: "2026-04-01",
      end: "2026-06-30",
    });

    const lancamentos = await prisma.lancamento.findMany({
      where: { userId: user.id },
      orderBy: { data: "asc" },
    });

    expect(lancamentos).toHaveLength(3);
    expect(lancamentos.map((l) => l.recorrenciaId)).toEqual([
      recorrencia.id,
      recorrencia.id,
      recorrencia.id,
    ]);
    expect(lancamentos.map((l) => l.valor)).toEqual([1000, 1000, 1000]);
  });

  it("edição 'só esta' não é sobrescrita pela regeneração", async () => {
    const email = "recorrencia-somente-esta@example.com";
    const user = await setupUser(email);
    const { conta, despesa } = await setupContaECategorias(user.id);

    const recorrencia = await createRecorrencia(user.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 1000,
      dataInicio: "2026-04-01",
      frequencia: FrequenciaRecorrencia.MENSAL,
      dia: 10,
      contaId: conta.id,
      categoriaId: despesa.id,
    });

    await materializarRecorrencias(user.id, {
      start: "2026-04-01",
      end: "2026-06-30",
    });

    const lancamentoAbril = await prisma.lancamento.findFirstOrThrow({
      where: { recorrenciaId: recorrencia.id, data: { gte: new Date("2026-04-09") } },
    });

    await editarOcorrenciaSomenteEsta(user.id, lancamentoAbril.id, {
      valor: 2000,
      escopo: "SOMENTE_ESTA",
    });

    await materializarRecorrencias(user.id, {
      start: "2026-04-01",
      end: "2026-06-30",
    });

    const atualizado = await prisma.lancamento.findUniqueOrThrow({
      where: { id: lancamentoAbril.id },
    });
    expect(atualizado.valor).toBe(2000);
    expect(atualizado.modificado).toBe(true);

    const demais = await prisma.lancamento.findMany({
      where: { recorrenciaId: recorrencia.id, id: { not: lancamentoAbril.id } },
    });
    expect(demais.every((l) => l.valor === 1000 && !l.modificado)).toBe(true);
  });

  it("edição 'esta e futuras' atualiza a regra e regenera futuras não-modificadas", async () => {
    const email = "recorrencia-esta-futuras@example.com";
    const user = await setupUser(email);
    const { conta, despesa } = await setupContaECategorias(user.id);

    const hojeStr = spDateStr(new Date());
    const inicioStr = addDaysSP(hojeStr, -10);
    const mesFuturo = addDaysSP(hojeStr, 40);

    const recorrencia = await createRecorrencia(user.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 1000,
      dataInicio: inicioStr,
      frequencia: FrequenciaRecorrencia.MENSAL,
      dia: Number(hojeStr.slice(8, 10)),
      contaId: conta.id,
      categoriaId: despesa.id,
    });

    await materializarRecorrencias(user.id, {
      start: inicioStr,
      end: mesFuturo,
    });

    const ocorrencias = gerarOcorrencias(recorrencia, inicioStr, mesFuturo);
    const dataFutura = ocorrencias.find((d) => d >= hojeStr)!;

    const lancamentoFuturo = await prisma.lancamento.findFirstOrThrow({
      where: {
        recorrenciaId: recorrencia.id,
        data: { gte: new Date(`${dataFutura}T00:00:00.000Z`) },
      },
    });

    await editarOcorrenciaEFuturas(user.id, lancamentoFuturo.id, {
      valor: 3000,
      escopo: "ESTA_E_FUTURAS",
    });

    await materializarRecorrencias(user.id, {
      start: inicioStr,
      end: mesFuturo,
    });

    const regraAtualizada = await prisma.recorrencia.findUniqueOrThrow({
      where: { id: recorrencia.id },
    });
    expect(regraAtualizada.valor).toBe(3000);

    const lancamentos = await prisma.lancamento.findMany({
      where: { recorrenciaId: recorrencia.id },
      orderBy: { data: "asc" },
    });

    const editado = lancamentos.find((l) => l.id === lancamentoFuturo.id);
    expect(editado).toBeUndefined();

    const futuros = lancamentos.filter(
      (l) => toSPDateString(l.data) >= dataFutura,
    );
    expect(futuros.every((l) => l.valor === 3000 && !l.modificado)).toBe(true);

    const passados = lancamentos.filter(
      (l) => toSPDateString(l.data) < dataFutura,
    );
    expect(passados.every((l) => l.valor === 1000)).toBe(true);
  });

  it("ocorrências recorrentes entram no motor de saldo como Lançamentos comuns", async () => {
    const email = "recorrencia-saldo@example.com";
    const user = await setupUser(email);
    const { conta, receita } = await setupContaECategorias(user.id);

    const hojeStr = spDateStr(new Date());
    const dataRecorrencia = addDaysSP(hojeStr, 5);

    const recorrencia = await createRecorrencia(user.id, {
      tipo: TipoLancamento.RECEITA,
      valor: 2000,
      dataInicio: dataRecorrencia,
      frequencia: FrequenciaRecorrencia.MENSAL,
      dia: Number(dataRecorrencia.slice(8, 10)),
      contaId: conta.id,
      categoriaId: receita.id,
    });

    await materializarRecorrencias(user.id, {
      start: dataRecorrencia,
      end: addDaysSP(dataRecorrencia, 30),
    });

    const lancamentos = await prisma.lancamento.findMany({
      where: { userId: user.id },
    });
    expect(lancamentos).toHaveLength(1);
    expect(lancamentos[0].recorrenciaId).toBe(recorrencia.id);

    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email },
    } as ReturnType<typeof auth>);

    const saldo = await getSaldoForUser(user.id, { ate: dataRecorrencia });
    const ponto = saldo.serieProjetada.find((p) => p.data === dataRecorrencia);
    expect(ponto?.saldo).toBe(2000);
  });

  it("materialização respeita dataFim da regra", async () => {
    const email = "recorrencia-fim@example.com";
    const user = await setupUser(email);
    const { conta, despesa } = await setupContaECategorias(user.id);

    await createRecorrencia(user.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 500,
      dataInicio: "2026-01-01",
      dataFim: "2026-03-01",
      frequencia: FrequenciaRecorrencia.MENSAL,
      dia: 1,
      contaId: conta.id,
      categoriaId: despesa.id,
    });

    await materializarRecorrencias(user.id, {
      start: "2026-01-01",
      end: "2026-12-31",
    });

    const lancamentos = await prisma.lancamento.findMany({
      where: { userId: user.id },
      orderBy: { data: "asc" },
    });

    expect(lancamentos).toHaveLength(3);
    expect(lancamentos.map((l) => toSPDateString(l.data))).toEqual([
      "2026-01-01",
      "2026-02-01",
      "2026-03-01",
    ]);
  });
});

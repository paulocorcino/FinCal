import { describe, expect, it, vi } from "vitest";
import { GET } from "../app/api/diagnostico/route";
import { auth } from "@/lib/auth";
import { signup } from "../app/actions/auth";
import { createConta } from "../lib/contas";
import { getCategoriesByUser } from "../lib/categories";
import { createLancamento, parseDataLancamento } from "../lib/lancamentos";
import { createRecorrencia } from "../lib/recorrencias";
import { createRendaLiquida } from "../lib/renda-liquida";
import { prisma } from "../lib/prisma";
import { Papel, TipoLancamento } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/diagnostico-narrativa", () => ({
  narrarDiagnostico: vi.fn().mockResolvedValue(
    "Narração educacional de teste. ×120 Disclaimer.",
  ),
}));

async function createUserForm(email: string, password: string) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  return form;
}

describe("diagnóstico API", () => {
  it("retorna métricas e narrativa a partir de dados de exemplo", async () => {
    const email = "diagnostico-user1@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    const corrente = await createConta(user!.id, {
      nome: "Conta Corrente",
      saldoInicial: 200000,
      papel: Papel.CORRENTE,
    });
    const reserva = await createConta(user!.id, {
      nome: "Reserva",
      saldoInicial: 100000,
      papel: Papel.RESERVA,
    });
    const cartao = await createConta(user!.id, {
      nome: "Cartão",
      saldoInicial: 0,
      papel: Papel.CARTAO,
    });
    const investimento = await createConta(user!.id, {
      nome: "Investimento",
      saldoInicial: 0,
      papel: Papel.INVESTIMENTO,
    });

    const categorias = await getCategoriesByUser(user!.id);
    const moradia = categorias.find((c) => c.nome === "Moradia")!;
    const lazer = categorias.find((c) => c.nome === "Lazer")!;
    const alimentacao = categorias.find((c) => c.nome === "Alimentação")!;
    const outras = categorias.find((c) => c.nome === "Outras despesas")!;

    await createRendaLiquida(user!.id, {
      valor: 100000,
      vigenteDesde: "2026-01-01",
    });

    await createRecorrencia(user!.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 30000,
      dataInicio: "2026-04-01",
      dataFim: "2026-04-30",
      frequencia: "MENSAL" as const,
      dia: 5,
      contaId: corrente.id,
      categoriaId: moradia.id,
    });

    await createLancamento(user!.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 20000,
      data: parseDataLancamento("2026-04-12"),
      contaId: corrente.id,
      categoriaId: lazer.id,
      status: "EFETIVADO",
    });

    await createLancamento(user!.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 6000,
      data: parseDataLancamento("2026-04-10"),
      contaId: cartao.id,
      categoriaId: lazer.id,
      status: "EFETIVADO",
    });

    await createLancamento(user!.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 4000,
      data: parseDataLancamento("2026-04-20"),
      contaId: cartao.id,
      categoriaId: alimentacao.id,
      status: "EFETIVADO",
    });

    await createLancamento(user!.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 5000,
      data: parseDataLancamento("2026-03-15"),
      contaId: cartao.id,
      categoriaId: lazer.id,
      status: "EFETIVADO",
    });

    await createLancamento(user!.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 50000,
      data: parseDataLancamento("2026-03-05"),
      contaId: investimento.id,
      categoriaId: outras.id,
      status: "EFETIVADO",
    });

    await createLancamento(user!.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 150000,
      data: parseDataLancamento("2026-02-10"),
      contaId: investimento.id,
      categoriaId: outras.id,
      status: "EFETIVADO",
    });

    await createLancamento(user!.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 250000,
      data: parseDataLancamento("2026-01-20"),
      contaId: investimento.id,
      categoriaId: outras.id,
      status: "EFETIVADO",
    });

    vi.mocked(auth).mockResolvedValue({
      user: { id: user!.id, email: user!.email },
    } as ReturnType<typeof auth>);

    const response = await GET(
      new Request("http://localhost:3000/api/diagnostico?mes=2026-04"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics.rendaLiquida).toBe(100000);
    expect(body.metrics.gastosFixos).toBe(30000);
    expect(body.metrics.gastosDiaADia).toBe(30000);
    expect(body.metrics.sobra).toBe(40000);
    expect(body.metrics.taxaPoupanca).toBe(0.4);
    expect(body.metrics.reservaAtual).toBe(280000);
    expect(body.metrics.gastoMensalMedio).toBe(151667);
    expect(body.metrics.metaReserva).toBe(910002);
    expect(body.metrics.analiseCartao.totalMesAtual).toBe(10000);
    expect(body.metrics.analiseCartao.totalMesAnterior).toBe(5000);
    expect(body.metrics.analiseCartao.variacao).toBe(100);
    expect(body.metrics.analiseCartao.topCategorias[0]).toEqual({
      nome: "Lazer",
      total: 6000,
    });
    expect(body.metrics.analiseCartao.metaReducao).toBe(7000);
    expect(body.narrativa).toMatch(/×120|educacional|Disclaimer/i);
  });

  it("retorna 404 quando não há renda líquida vigente", async () => {
    const email = "diagnostico-user2@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    vi.mocked(auth).mockResolvedValue({
      user: { id: user!.id, email: user!.email },
    } as ReturnType<typeof auth>);

    const response = await GET(
      new Request("http://localhost:3000/api/diagnostico?mes=2026-04"),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Renda líquida não encontrada para o mês");
  });
});

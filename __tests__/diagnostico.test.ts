import { describe, expect, it, vi } from "vitest";
import { Papel, StatusLancamento, TipoLancamento } from "@prisma/client";
import {
  buscarRendaLiquidaVigente,
  calcularAnaliseCartao,
  calcularDistribuicaoReal,
  calcularGastoMensalMedio,
  calcularGastosDiaADia,
  calcularGastosFixos,
  calcularMetaReserva,
  calcularReservaAtual,
  calcularSobra,
  calcularTaxaPoupanca,
  type DiagnosticoContaInput,
  type DiagnosticoLancamentoInput,
} from "../lib/diagnostico";
import { DIAGNOSTICO_CONFIG } from "../lib/diagnostico-config";
import { narrarDiagnostico } from "../lib/diagnostico-narrativa";
import type { DiagnosticoMetrics } from "../lib/diagnostico-service";

function despesa(
  valor: number,
  data: string,
  opts: {
    recorrente?: boolean;
    status?: StatusLancamento;
    contaId?: string;
    categoria?: { nome: string };
    transferenciaId?: string | null;
  } = {},
): DiagnosticoLancamentoInput {
  return {
    tipo: TipoLancamento.DESPESA,
    valor,
    data: new Date(`${data}T00:00:00-03:00`),
    status: opts.status ?? StatusLancamento.EFETIVADO,
    contaId: opts.contaId ?? "conta-corrente",
    recorrenciaId: opts.recorrente ? "rec-1" : null,
    transferenciaId: opts.transferenciaId ?? null,
    categoria: opts.categoria ?? null,
  };
}

function receita(
  valor: number,
  data: string,
  opts: {
    status?: StatusLancamento;
    contaId?: string;
  } = {},
): DiagnosticoLancamentoInput {
  return {
    tipo: TipoLancamento.RECEITA,
    valor,
    data: new Date(`${data}T00:00:00-03:00`),
    status: opts.status ?? StatusLancamento.EFETIVADO,
    contaId: opts.contaId ?? "conta-corrente",
    recorrenciaId: null,
    transferenciaId: null,
    categoria: null,
  };
}

function conta(id: string, papel: Papel, saldoInicial = 0): DiagnosticoContaInput {
  return { id, papel, saldoInicial };
}

describe("diagnóstico puro", () => {
  it("busca renda líquida vigente como a mais recente <= primeiro dia do mês", () => {
    const rendas = [
      { valor: 500000, vigenteDesde: "2026-01-01" },
      { valor: 550000, vigenteDesde: "2026-02-15" },
      { valor: 600000, vigenteDesde: "2026-03-01" },
    ];

    const vigente = buscarRendaLiquidaVigente(rendas, "2026-03");
    expect(vigente).toEqual({ valor: 600000, vigenteDesde: "2026-03-01" });
  });

  it("calcula média dos últimos 3 meses completos de despesas efetivadas", () => {
    const lancamentos = [
      despesa(10000, "2026-03-01"),
      despesa(40000, "2026-03-15"),
      despesa(50000, "2026-02-10"),
      despesa(100000, "2026-02-20"),
      despesa(120000, "2026-01-05"),
      despesa(130000, "2026-01-25"),
    ];

    expect(calcularGastoMensalMedio(lancamentos, "2026-04")).toBe(150000);
  });

  it("faz fallback à média disponível quando há menos de 3 meses", () => {
    const lancamentos = [
      despesa(50000, "2026-03-01"),
      despesa(150000, "2026-02-10"),
    ];

    expect(calcularGastoMensalMedio(lancamentos, "2026-04")).toBe(100000);
  });

  it("separa gastos fixos e dia a dia e calcula sobra e taxa de poupança", () => {
    const lancamentos = [
      despesa(30000, "2026-04-05", { recorrente: true }),
      despesa(20000, "2026-04-12"),
      despesa(10000, "2026-04-20", { transferenciaId: "t1" }),
    ];

    expect(calcularGastosFixos(lancamentos, "2026-04")).toBe(30000);
    expect(calcularGastosDiaADia(lancamentos, "2026-04")).toBe(20000);
    expect(calcularSobra(100000, lancamentos, "2026-04")).toBe(50000);
    expect(calcularTaxaPoupanca(50000, 100000)).toBe(0.5);
  });

  it("calcula reserva atual apenas com contas CORRENTE e RESERVA", () => {
    const contas = [
      conta("c1", Papel.CORRENTE, 200000),
      conta("c2", Papel.RESERVA, 100000),
      conta("c3", Papel.INVESTIMENTO, 50000),
      conta("c4", Papel.CARTAO, -20000),
    ];

    expect(calcularReservaAtual(contas, [], "2026-04")).toBe(300000);
  });

  it("calcula meta de reserva como 6× o gasto mensal médio", () => {
    expect(calcularMetaReserva(150000, DIAGNOSTICO_CONFIG.RESERVA_MESES)).toBe(
      900000,
    );
  });

  it("calcula distribuição real em percentuais e razão necessidades/desejos", () => {
    const distribuicao = calcularDistribuicaoReal(100000, 30000, 20000, 50000);
    expect(distribuicao.necessidades).toBe(30);
    expect(distribuicao.desejos).toBe(20);
    expect(distribuicao.poupanca).toBe(50);
    expect(distribuicao.necessidadesDesejosRatio).toBe(1.5);
  });

  it("análise de cartão retorna top categoria, variação e meta de redução", () => {
    const contas = [conta("cartao", Papel.CARTAO, 0)];
    const lancamentos = [
      despesa(6000, "2026-04-10", {
        contaId: "cartao",
        categoria: { nome: "Lazer" },
      }),
      despesa(4000, "2026-04-20", {
        contaId: "cartao",
        categoria: { nome: "Alimentação" },
      }),
      despesa(5000, "2026-03-15", {
        contaId: "cartao",
        categoria: { nome: "Lazer" },
      }),
    ];

    const analise = calcularAnaliseCartao(
      lancamentos,
      contas,
      "2026-04",
      DIAGNOSTICO_CONFIG.CARTAO_META_REDUCAO,
    );

    expect(analise.totalMesAtual).toBe(10000);
    expect(analise.totalMesAnterior).toBe(5000);
    expect(analise.variacao).toBe(100);
    expect(analise.topCategorias[0]).toEqual({ nome: "Lazer", total: 6000 });
    expect(analise.metaReducao).toBe(7000);
  });
});

describe("narração do diagnóstico", () => {
  it("envia prompt com métricas, ×120, premissa e retorna texto com disclaimer", async () => {
    const metrics: DiagnosticoMetrics = {
      mes: "2026-04",
      rendaLiquida: 100000,
      gastosFixos: 30000,
      gastosDiaADia: 20000,
      sobra: 50000,
      taxaPoupanca: 0.5,
      reservaAtual: 300000,
      metaReserva: 900000,
      distribuicaoReal: {
        necessidades: 30,
        desejos: 20,
        poupanca: 50,
        necessidadesDesejosRatio: 1.5,
      },
      gastoMensalMedio: 150000,
      analiseCartao: {
        totalMesAtual: 10000,
        totalMesAnterior: 5000,
        variacao: 100,
        topCategorias: [{ nome: "Lazer", total: 6000 }],
        metaReducao: 7000,
      },
    };

    const create = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content:
              "Você está indo bem. Disclaimer: conteúdo educacional, não substitui aconselhamento profissional.",
          },
        },
      ],
    });

    const openai = { chat: { completions: { create } } } as unknown as import("openai").default;

    const narrativa = await narrarDiagnostico(metrics, { openai });

    expect(create).toHaveBeenCalledTimes(1);
    const prompt = create.mock.calls[0][0].messages[1].content as string;
    expect(prompt).toContain("×120");
    expect(prompt).toMatch(/premissa/i);
    expect(prompt).toContain(JSON.stringify(metrics, null, 2));
    expect(narrativa).toMatch(/educacional|Disclaimer/i);
  });

  it("retorna narrativa fallback quando não há cliente OpenAI", async () => {
    const metrics: DiagnosticoMetrics = {
      mes: "2026-04",
      rendaLiquida: 100000,
      gastosFixos: 30000,
      gastosDiaADia: 20000,
      sobra: 50000,
      taxaPoupanca: 0.5,
      reservaAtual: 300000,
      metaReserva: 900000,
      distribuicaoReal: {
        necessidades: 30,
        desejos: 20,
        poupanca: 50,
        necessidadesDesejosRatio: 1.5,
      },
      gastoMensalMedio: 150000,
      analiseCartao: {
        totalMesAtual: 10000,
        totalMesAnterior: 5000,
        variacao: 100,
        topCategorias: [{ nome: "Lazer", total: 6000 }],
        metaReducao: 7000,
      },
    };

    const narrativa = await narrarDiagnostico(metrics);
    expect(narrativa).toContain("×120");
    expect(narrativa).toMatch(/educacional|Disclaimer/i);
  });
});

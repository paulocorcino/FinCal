import { describe, expect, it } from "vitest";
import {
  calcularSaldoAtual,
  calcularSerieProjetada,
  fimDoMesSP,
  type SaldoContaInput,
  type SaldoLancamentoInput,
} from "../lib/saldo";
import { StatusLancamento, TipoLancamento } from "@prisma/client";

function conta(
  id: string,
  saldoInicial: number,
): SaldoContaInput {
  return { id, saldoInicial };
}

function lancamento(
  tipo: TipoLancamento,
  valor: number,
  data: string,
  contaId: string,
  status: StatusLancamento = StatusLancamento.PENDENTE,
): SaldoLancamentoInput {
  return {
    tipo,
    valor,
    data: new Date(`${data}T00:00:00-03:00`),
    contaId,
    status,
  };
}

describe("saldo engine", () => {
  it("retorna série de 31 pontos para mês de 31 dias", () => {
    const hoje = new Date("2026-01-01T00:00:00-03:00");
    const ate = new Date("2026-01-31T00:00:00-03:00");
    const contas = [conta("c1", 100000)];
    const lancamentos = [lancamento("DESPESA", 1000, "2026-01-15", "c1")];

    const { serieProjetada } = calcularSerieProjetada(
      contas,
      lancamentos,
      hoje,
      ate,
    );

    expect(serieProjetada.length).toBe(31);
    expect(serieProjetada[0].data).toBe("2026-01-01");
    expect(serieProjetada[30].data).toBe("2026-01-31");
  });

  it("identifica o primeiro dia negativo ao cruzar zero", () => {
    const hoje = new Date("2026-01-01T00:00:00-03:00");
    const ate = new Date("2026-01-10T00:00:00-03:00");
    const contas = [conta("c1", 3000)];
    const lancamentos = [
      lancamento("DESPESA", 1000, "2026-01-03", "c1"),
      lancamento("DESPESA", 1000, "2026-01-04", "c1"),
      lancamento("DESPESA", 1001, "2026-01-05", "c1"),
    ];

    const { primeiroDiaNegativo } = calcularSerieProjetada(
      contas,
      lancamentos,
      hoje,
      ate,
    );

    expect(primeiroDiaNegativo).toBe("2026-01-05");
  });

  it("inclui lançamento no último dia do horizonte", () => {
    const hoje = new Date("2026-02-01T00:00:00-03:00");
    const ate = new Date("2026-02-05T00:00:00-03:00");
    const contas = [conta("c1", 0)];
    const lancamentos = [lancamento("RECEITA", 5000, "2026-02-05", "c1")];

    const { serieProjetada } = calcularSerieProjetada(
      contas,
      lancamentos,
      hoje,
      ate,
    );

    expect(serieProjetada.at(-1)).toEqual({ data: "2026-02-05", saldo: 5000 });
  });

  it("retorna série plana no saldoInicial quando não há lançamentos", () => {
    const hoje = new Date("2026-03-10T00:00:00-03:00");
    const ate = new Date("2026-03-12T00:00:00-03:00");
    const contas = [conta("c1", 75000)];

    const { saldoAtual, serieProjetada, primeiroDiaNegativo } =
      calcularSerieProjetada(contas, [], hoje, ate);

    expect(saldoAtual).toBe(75000);
    expect(serieProjetada).toEqual([
      { data: "2026-03-10", saldo: 75000 },
      { data: "2026-03-11", saldo: 75000 },
      { data: "2026-03-12", saldo: 75000 },
    ]);
    expect(primeiroDiaNegativo).toBeNull();
  });

  it("consolida saldo de várias contas e filtra por contaId", () => {
    const hoje = new Date("2026-04-01T00:00:00-03:00");
    const ate = new Date("2026-04-01T00:00:00-03:00");
    const contas = [conta("c1", 10000), conta("c2", 5000)];
    const lancamentos = [
      lancamento("RECEITA", 2000, "2026-04-01", "c1", StatusLancamento.EFETIVADO),
      lancamento("RECEITA", 3000, "2026-04-01", "c2", StatusLancamento.EFETIVADO),
    ];

    const consolidado = calcularSerieProjetada(
      contas,
      lancamentos,
      hoje,
      ate,
    );
    const filtrado = calcularSerieProjetada(
      contas.filter((c) => c.id === "c1"),
      lancamentos.filter((l) => l.contaId === "c1"),
      hoje,
      ate,
    );

    expect(consolidado.saldoAtual).toBe(20000);
    expect(consolidado.serieProjetada[0].saldo).toBe(20000);
    expect(filtrado.saldoAtual).toBe(12000);
    expect(filtrado.serieProjetada[0].saldo).toBe(12000);
  });

  it("respeita horizonte configurável e usa fim do mês como padrão", () => {
    const hoje = new Date("2026-05-15T00:00:00-03:00");
    const contas = [conta("c1", 0)];
    const lancamentos: SaldoLancamentoInput[] = [];

    const ateExplicito = new Date("2026-05-17T00:00:00-03:00");
    const explicito = calcularSerieProjetada(
      contas,
      lancamentos,
      hoje,
      ateExplicito,
    );

    expect(explicito.serieProjetada.length).toBe(3);
    expect(explicito.serieProjetada.at(-1)?.data).toBe("2026-05-17");

    const padrao = fimDoMesSP(hoje);
    expect(padrao).toBe("2026-05-31");
    const comPadrao = calcularSerieProjetada(
      contas,
      lancamentos,
      hoje,
      new Date(`${padrao}T00:00:00-03:00`),
    );
    expect(comPadrao.serieProjetada.length).toBe(17);
    expect(comPadrao.serieProjetada.at(-1)?.data).toBe("2026-05-31");
  });

  it("saldo atual considera apenas lançamentos efetivados até hoje", () => {
    const hoje = new Date("2026-06-10T00:00:00-03:00");
    const contas = [conta("c1", 10000)];
    const lancamentos = [
      lancamento("RECEITA", 5000, "2026-06-09", "c1", StatusLancamento.EFETIVADO),
      lancamento("RECEITA", 3000, "2026-06-10", "c1", StatusLancamento.PENDENTE),
      lancamento("RECEITA", 2000, "2026-06-11", "c1", StatusLancamento.EFETIVADO),
    ];

    const atual = calcularSaldoAtual(contas, lancamentos, hoje);
    expect(atual).toBe(15000);
  });
});

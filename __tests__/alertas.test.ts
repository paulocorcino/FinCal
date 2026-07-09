import { describe, expect, it } from "vitest";
import { StatusLancamento } from "@prisma/client";
import { calcularAlertas, type AlertaLancamentoInput } from "../lib/alertas";
import type { SaldoResultado } from "../lib/saldo";

function lanc(
  status: StatusLancamento,
  data: string,
): AlertaLancamentoInput {
  return { status, data: new Date(`${data}T00:00:00-03:00`) };
}

function saldoResult(primeiroDiaNegativo: string | null): SaldoResultado {
  return { saldoAtual: 0, serieProjetada: [], primeiroDiaNegativo };
}

describe("calcularAlertas", () => {
  it("dispara alerta de atrasado para lançamento PENDENTE no passado", () => {
    const hoje = new Date("2026-01-10T00:00:00-03:00");
    const alertas = calcularAlertas(
      [lanc(StatusLancamento.PENDENTE, "2026-01-05")],
      saldoResult(null),
      hoje,
    );
    expect(alertas).toHaveLength(1);
    expect(alertas[0].tipo).toBe("ATRASADO");
  });

  it("dispara alerta de próximo para lançamento PENDENTE dentro de [hoje, hoje+7]", () => {
    const hoje = new Date("2026-01-10T00:00:00-03:00");
    const alertas = calcularAlertas(
      [lanc(StatusLancamento.PENDENTE, "2026-01-12")],
      saldoResult(null),
      hoje,
    );
    expect(alertas).toHaveLength(1);
    expect(alertas[0].tipo).toBe("PROXIMO");
  });

  it("não classifica atrasado como próximo", () => {
    const hoje = new Date("2026-01-10T00:00:00-03:00");
    const alertas = calcularAlertas(
      [lanc(StatusLancamento.PENDENTE, "2026-01-05")],
      saldoResult(null),
      hoje,
      7,
    );
    expect(alertas.some((a) => a.tipo === "PROXIMO")).toBe(false);
  });

  it("dispara alerta de projeção negativa com o primeiro dia de cruzamento", () => {
    const hoje = new Date("2026-01-10T00:00:00-03:00");
    const alertas = calcularAlertas([], saldoResult("2026-01-15"), hoje);
    expect(alertas).toHaveLength(1);
    expect(alertas[0].tipo).toBe("PROJECAO_NEGATIVA");
    expect(alertas[0].data).toBe("2026-01-15");
  });

  it("não dispara alertas quando não há condições", () => {
    const hoje = new Date("2026-01-10T00:00:00-03:00");
    const alertas = calcularAlertas(
      [lanc(StatusLancamento.EFETIVADO, "2026-01-05")],
      saldoResult(null),
      hoje,
    );
    expect(alertas).toHaveLength(0);
  });
});

import { describe, it, expect } from "vitest";
import {
  calcularSaldoAtual,
  calcularSerieProjetada,
  primeiroDiaNegativo,
  fimDoMesAtual,
} from "@/lib/saldo";

describe("calcularSaldoAtual", () => {
  it("retorna o saldo inicial quando não há lançamentos", () => {
    expect(calcularSaldoAtual(10000, [])).toBe(10000);
  });

  it("soma RECEITA ao saldo inicial", () => {
    expect(
      calcularSaldoAtual(10000, [{ valor: 5000, tipo: "RECEITA" }])
    ).toBe(15000);
  });

  it("subtrai DESPESA do saldo inicial", () => {
    expect(
      calcularSaldoAtual(10000, [{ valor: 3000, tipo: "DESPESA" }])
    ).toBe(7000);
  });

  it("acumula RECEITA e DESPESA juntas", () => {
    expect(
      calcularSaldoAtual(10000, [
        { valor: 5000, tipo: "RECEITA" },
        { valor: 3000, tipo: "DESPESA" },
      ])
    ).toBe(12000);
  });

  it("preserva saldo inicial negativo (CARTAO)", () => {
    expect(calcularSaldoAtual(-50000, [])).toBe(-50000);
  });
});

describe("calcularSerieProjetada", () => {
  it("mês de 31 dias sem lançamentos -> 31 pontos cada igual ao saldoInicial", () => {
    const serie = calcularSerieProjetada(100000, "2026-07-01", "2026-07-31", []);
    expect(serie).toHaveLength(31);
    expect(serie.every((p) => p.saldo === 100000)).toBe(true);
    expect(serie[0]).toEqual({ data: "2026-07-01", saldo: 100000 });
    expect(serie[30]).toEqual({ data: "2026-07-31", saldo: 100000 });
  });

  it("lançamento no limite do horizonte é incluído", () => {
    const serie = calcularSerieProjetada(100000, "2026-07-01", "2026-07-31", [
      { valor: 5000, tipo: "DESPESA", data: "2026-07-31" },
    ]);
    expect(serie[30].saldo).toBe(95000);
    expect(serie[29].saldo).toBe(100000);
  });

  it("cross-month horizon produz um ponto por dia", () => {
    const serie = calcularSerieProjetada(0, "2026-07-28", "2026-08-02", []);
    expect(serie).toHaveLength(6);
    expect(serie[0].data).toBe("2026-07-28");
    expect(serie[5].data).toBe("2026-08-02");
  });

  it("pontos crescentes para RECEITA diária", () => {
    const serie = calcularSerieProjetada(0, "2026-07-01", "2026-07-05", [
      { valor: 1000, tipo: "RECEITA", data: "2026-07-02" },
      { valor: 2000, tipo: "RECEITA", data: "2026-07-04" },
    ]);
    expect(serie.map((p) => p.saldo)).toEqual([0, 1000, 1000, 3000, 3000]);
    for (let i = 1; i < serie.length; i++) {
      expect(serie[i].saldo).toBeGreaterThanOrEqual(serie[i - 1].saldo);
    }
  });

  it("sem lançamentos -> saldo constante igual ao saldoInicial", () => {
    const serie = calcularSerieProjetada(5000, "2026-07-10", "2026-07-12", []);
    expect(serie.every((p) => p.saldo === 5000)).toBe(true);
  });
});

describe("primeiroDiaNegativo", () => {
  it("retorna o primeiro dia cujo saldo é negativo", () => {
    const serie = [
      { data: "2026-07-13", saldo: 1000 },
      { data: "2026-07-14", saldo: 0 },
      { data: "2026-07-15", saldo: -100 },
      { data: "2026-07-16", saldo: -500 },
    ];
    expect(primeiroDiaNegativo(serie)).toBe("2026-07-15");
  });

  it("retorna null quando a série nunca é negativa", () => {
    const serie = [
      { data: "2026-07-13", saldo: 1000 },
      { data: "2026-07-14", saldo: 0 },
      { data: "2026-07-15", saldo: 500 },
    ];
    expect(primeiroDiaNegativo(serie)).toBeNull();
  });

  it("trata série vazia como não-negativa", () => {
    expect(primeiroDiaNegativo([])).toBeNull();
  });
});

describe("fimDoMesAtual", () => {
  it("retorna o último dia de mês de 31 dias", () => {
    expect(fimDoMesAtual("2026-07-13")).toBe("2026-07-31");
  });

  it("retorna o último dia de mês de 30 dias", () => {
    expect(fimDoMesAtual("2026-06-10")).toBe("2026-06-30");
  });

  it("retorna dia 28 para fevereiro não-bissexto", () => {
    expect(fimDoMesAtual("2026-02-10")).toBe("2026-02-28");
  });

  it("retorna dia 29 para fevereiro bissexto", () => {
    expect(fimDoMesAtual("2024-02-10")).toBe("2024-02-29");
  });
});

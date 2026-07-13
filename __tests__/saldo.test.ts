import { describe, it, expect } from "vitest";
import { calcularSaldoAtual } from "@/lib/saldo";

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

import { describe, expect, it } from "vitest";
import {
  addMonthsSP,
  dataHojeSP,
  diaDaSemanaSP,
  diasDoMesSP,
  mesAtualSP,
  parseMes,
  primeiroDiaDoMesSP,
  ultimoDiaDoMesSP,
} from "../lib/agenda";

describe("agenda helpers", () => {
  it("parseMes extrai ano e mês", () => {
    expect(parseMes("2026-07")).toEqual({ ano: 2026, mes: 7 });
  });

  it("parseMes rejeita formato inválido", () => {
    expect(() => parseMes("2026-7")).toThrow("YYYY-MM");
    expect(() => parseMes("07-2026")).toThrow("YYYY-MM");
  });

  it("mesAtualSP retorna o mês corrente em São Paulo", () => {
    const fixed = new Date("2026-01-15T12:00:00-03:00");
    expect(mesAtualSP(fixed)).toBe("2026-01");
  });

  it("primeiroDiaDoMesSP retorna o primeiro dia", () => {
    expect(primeiroDiaDoMesSP("2026-02")).toBe("2026-02-01");
  });

  it("ultimoDiaDoMesSP retorna o último dia de cada mês", () => {
    expect(ultimoDiaDoMesSP("2026-01")).toBe("2026-01-31");
    expect(ultimoDiaDoMesSP("2026-02")).toBe("2026-02-28");
    expect(ultimoDiaDoMesSP("2024-02")).toBe("2024-02-29");
    expect(ultimoDiaDoMesSP("2026-04")).toBe("2026-04-30");
  });

  it("addMonthsSP navega entre meses e anos", () => {
    expect(addMonthsSP("2026-01", -1)).toBe("2025-12");
    expect(addMonthsSP("2026-12", 1)).toBe("2027-01");
    expect(addMonthsSP("2026-06", 6)).toBe("2026-12");
    expect(addMonthsSP("2026-06", -6)).toBe("2025-12");
  });

  it("diaDaSemanaSP retorna o dia correto para datas conhecidas", () => {
    expect(diaDaSemanaSP("2026-07-09")).toBe(4); // quinta
    expect(diaDaSemanaSP("2026-07-12")).toBe(0); // domingo
    expect(diaDaSemanaSP("2026-07-13")).toBe(1); // segunda
  });

  it("diasDoMesSP lista todos os dias do mês", () => {
    const dias = diasDoMesSP("2026-02");
    expect(dias.length).toBe(28);
    expect(dias[0]).toEqual({ data: "2026-02-01", diaDaSemana: 0 });
    expect(dias.at(-1)).toEqual({ data: "2026-02-28", diaDaSemana: 6 });

    expect(diasDoMesSP("2026-01").length).toBe(31);
    expect(diasDoMesSP("2026-04").length).toBe(30);
  });

  it("não sofre off-by-one na meia-noite de São Paulo", () => {
    const spMidnight = new Date("2026-07-09T03:00:00Z");
    expect(dataHojeSP(spMidnight)).toBe("2026-07-09");
  });
});

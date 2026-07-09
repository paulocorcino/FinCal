import { describe, expect, it } from "vitest";
import { FrequenciaRecorrencia } from "@prisma/client";
import { gerarOcorrencias } from "../lib/recorrencias";

describe("gerarOcorrencias", () => {
  it("gera mensalmente no dia literal mesmo em fim de semana", () => {
    const recorrencia = {
      frequencia: FrequenciaRecorrencia.MENSAL,
      dia: 10,
      dataInicio: "2026-03-10",
      dataFim: null as string | null,
    };

    const ocorrencias = gerarOcorrencias(recorrencia, "2026-03-01", "2026-05-31");

    expect(ocorrencias).toEqual(["2026-03-10", "2026-04-10", "2026-05-10"]);
  });

  it("gera semanalmente a cada 7 dias no dia da semana escolhido", () => {
    const recorrencia = {
      frequencia: FrequenciaRecorrencia.SEMANAL,
      dia: 5, // Friday
      dataInicio: "2026-04-03",
      dataFim: null as string | null,
    };

    const ocorrencias = gerarOcorrencias(recorrencia, "2026-04-01", "2026-04-30");

    expect(ocorrencias).toEqual([
      "2026-04-03",
      "2026-04-10",
      "2026-04-17",
      "2026-04-24",
    ]);
  });

  it("respeita dataFim e para exatamente nela", () => {
    const recorrencia = {
      frequencia: FrequenciaRecorrencia.MENSAL,
      dia: 15,
      dataInicio: "2026-01-15",
      dataFim: "2026-03-15",
    };

    const ocorrencias = gerarOcorrencias(recorrencia, "2026-01-01", "2026-12-31");

    expect(ocorrencias).toEqual(["2026-01-15", "2026-02-15", "2026-03-15"]);
  });

  it("clampa dia ao último dia de meses mais curtos", () => {
    const recorrencia = {
      frequencia: FrequenciaRecorrencia.MENSAL,
      dia: 31,
      dataInicio: "2026-02-01",
      dataFim: null as string | null,
    };

    const ocorrencias = gerarOcorrencias(recorrencia, "2026-01-01", "2026-05-31");

    expect(ocorrencias).toEqual([
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
    ]);
  });
});

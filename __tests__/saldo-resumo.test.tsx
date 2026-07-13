import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SaldoResumo } from "@/components/saldo/saldo-resumo";
import type { SerieSaldos } from "@/lib/saldo-actions";

describe("SaldoResumo", () => {
  it("renderiza atual, projetado e linha de dia negativo", () => {
    const serie: SerieSaldos = {
      atual: 123456,
      projetado: [{ data: "2026-07-31", saldo: 50000 }],
      primeiroDiaNegativo: "2026-07-20",
      horizonte: "2026-07-31",
    };

    render(<SaldoResumo serie={serie} />);

    expect(screen.getByText(/1\.234,56/)).toBeInTheDocument();
    expect(screen.getByText(/500,00/)).toBeInTheDocument();
    expect(
      screen.getByText(/saldo negativo a partir de 20\/07\/2026/i)
    ).toBeInTheDocument();
  });

  it("omits linha de dia negativo quando primeiroDiaNegativo === null", () => {
    const serie: SerieSaldos = {
      atual: 10000,
      projetado: [{ data: "2026-07-31", saldo: 9000 }],
      primeiroDiaNegativo: null,
      horizonte: "2026-07-31",
    };

    render(<SaldoResumo serie={serie} />);

    expect(screen.queryByText(/negativo/i)).toBeNull();
  });

  it("usa serie.atual como fallback quando projetado está vazio", () => {
    const serie: SerieSaldos = {
      atual: 7000,
      projetado: [],
      primeiroDiaNegativo: null,
      horizonte: "2026-07-31",
    };

    render(<SaldoResumo serie={serie} />);

    expect(screen.getAllByText(/70,00/)).toHaveLength(2);
  });

  it("formata o horizonte como DD/MM/YYYY no título do projetado", () => {
    const serie: SerieSaldos = {
      atual: 1000,
      projetado: [{ data: "2026-08-15", saldo: 800 }],
      primeiroDiaNegativo: null,
      horizonte: "2026-08-15",
    };

    render(<SaldoResumo serie={serie} />);

    expect(
      screen.getByText("Saldo Projetado em 15/08/2026")
    ).toBeInTheDocument();
  });
});

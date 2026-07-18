import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/categoria-actions", () => ({
  listarCategorias: vi.fn(),
  criarCategoria: vi.fn(),
  editarCategoria: vi.fn(),
  excluirCategoria: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { CategoriasScreen } from "@/components/categorias/categorias-screen";

const categorias = [
  {
    id: "c1",
    nome: "Moradia",
    tipo: "DESPESA" as const,
    cor: null,
    icone: null,
  },
];

describe("CategoriasScreen", () => {
  it("renderiza EmptyState com CTA quando vazia", () => {
    render(<CategoriasScreen categorias={[]} />);
    expect(
      screen.getByRole("button", { name: /criar sua primeira categoria/i })
    ).toBeInTheDocument();
  });

  it("renderiza nome e tipo quando há categorias", () => {
    render(<CategoriasScreen categorias={categorias} />);
    expect(screen.getByText("Moradia")).toBeInTheDocument();
    expect(screen.getByText("Despesa")).toBeInTheDocument();
  });

  it("clicar no gatilho de exclusão revela AlertDialog com Excluir + Cancelar", async () => {
    const user = userEvent.setup();
    render(<CategoriasScreen categorias={categorias} />);
    const trigger = screen.getByRole("button", {
      name: /excluir moradia/i,
    });
    await user.click(trigger);
    expect(
      screen.getByRole("button", { name: /^excluir$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancelar/i })
    ).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/conta-actions", () => ({
  criarConta: vi.fn(),
  editarConta: vi.fn(),
  excluirConta: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { ContasScreen } from "@/components/contas/contas-screen";
import { formatarBRL } from "@/lib/format";

const contas = [
  {
    id: "c1",
    nome: "Nubank",
    papel: "CORRENTE" as const,
    saldoInicial: 10000,
    saldoAtual: 10000,
  },
];

describe("ContasScreen", () => {
  it("renderiza EmptyState com CTA quando vazia", () => {
    render(<ContasScreen contas={[]} />);
    expect(
      screen.getByRole("button", { name: /criar sua primeira conta/i })
    ).toBeInTheDocument();
  });

  it("renderiza nome, papel e saldo formatado quando há contas", () => {
    render(<ContasScreen contas={contas} />);
    expect(screen.getByText("Nubank")).toBeInTheDocument();
    expect(screen.getByText("Corrente")).toBeInTheDocument();
    expect(
      screen.getByText((_, node) => {
        if (!node) return false;
        const text = node.textContent ?? "";
        return /R\$\s*100,00/.test(text) && text.includes("100,00");
      })
    ).toBeInTheDocument();
  });

  it("mostra o saldo em vermelho quando negativo", () => {
    render(
      <ContasScreen
        contas={[{ ...contas[0], saldoAtual: -5000 }]}
      />
    );
    const saldo = screen.getByText((_, node) => {
      if (!node) return false;
      return /-\s*R\$\s*50,00/.test(node.textContent ?? "");
    });
    expect(saldo.className).toContain("text-destructive");
  });

  it("clicar no gatilho de exclusão revela AlertDialog com Excluir + Cancelar", async () => {
    const user = userEvent.setup();
    render(<ContasScreen contas={contas} />);
    const trigger = screen.getByRole("button", {
      name: /excluir nubank/i,
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

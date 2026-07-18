import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  criarLancamento: vi.fn(),
  editarLancamento: vi.fn(),
  excluirLancamento: vi.fn(),
  efetivarLancamento: vi.fn(),
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/lib/lancamento-actions", () => ({
  criarLancamento: (...args: unknown[]) => mocks.criarLancamento(...args),
  editarLancamento: (...args: unknown[]) => mocks.editarLancamento(...args),
  excluirLancamento: (...args: unknown[]) => mocks.excluirLancamento(...args),
  efetivarLancamento: (...args: unknown[]) => mocks.efetivarLancamento(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
    error: (...args: unknown[]) => mocks.toastError(...args),
  },
}));

import { LancamentoForm } from "@/components/lancamentos/lancamento-form";
import { LancamentoDeleteDialog } from "@/components/lancamentos/lancamento-delete-dialog";
import { LancamentoEfetivarDialog } from "@/components/lancamentos/lancamento-efetivar-dialog";
import { Button } from "@/components/ui/button";
import { formatarBRL } from "@/lib/format";

const contas = [{ id: "c1", nome: "Nubank" }];
const categorias = [
  { id: "cat1", nome: "Moradia", tipo: "DESPESA" },
  { id: "cat2", nome: "Salário", tipo: "RECEITA" },
];

function namedField(name: string): HTMLElement | null {
  return document.querySelector(`[name="${name}"]`);
}

describe("LancamentoForm", () => {
  beforeEach(() => {
    mocks.criarLancamento.mockReset();
    mocks.editarLancamento.mockReset();
    mocks.excluirLancamento.mockReset();
    mocks.efetivarLancamento.mockReset();
    mocks.refresh.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
  });

  it("com contas vazias: mostra 'Crie uma Conta primeiro' e nenhum campo valor", () => {
    render(<LancamentoForm contas={[]} categorias={[]} open={true} />);
    expect(screen.getByText(/crie uma conta primeiro/i)).toBeInTheDocument();
    expect(namedField("valor")).toBeNull();
    expect(screen.getByRole("link", { name: /ir para contas/i })).toHaveAttribute(
      "href",
      "/contas"
    );
  });

  it("com contas populadas: renderiza campos tipo, valor, data, status, contaId, categoriaId", () => {
    render(
      <LancamentoForm contas={contas} categorias={categorias} open={true} />
    );
    expect(namedField("tipo")).not.toBeNull();
    expect(namedField("valor")).not.toBeNull();
    expect(namedField("data")).not.toBeNull();
    expect(namedField("status")).not.toBeNull();
    expect(namedField("contaId")).not.toBeNull();
    expect(namedField("categoriaId")).not.toBeNull();
  });

  it("submit happy path: chama criarLancamento e toast.success uma vez", async () => {
    mocks.criarLancamento.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(
      <LancamentoForm contas={contas} categorias={categorias} open={true} />
    );
    await user.click(screen.getByRole("button", { name: /criar lançamento/i }));
    await waitFor(() => {
      expect(mocks.criarLancamento).toHaveBeenCalledOnce();
    });
    const fd = mocks.criarLancamento.mock.calls[0][1] as FormData;
    expect(fd.get("tipo")).toBe("DESPESA");
    expect(fd.get("contaId")).toBe("c1");
    expect(mocks.toastSuccess).toHaveBeenCalledOnce();
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Lançamento criado.");
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("submit error path: chama toast.error com a mensagem retornada", async () => {
    mocks.criarLancamento.mockResolvedValueOnce({ error: "Data inválida." });
    const user = userEvent.setup();
    render(
      <LancamentoForm contas={contas} categorias={categorias} open={true} />
    );
    await user.click(screen.getByRole("button", { name: /criar lançamento/i }));
    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledOnce();
    });
    expect(mocks.toastError).toHaveBeenCalledWith("Data inválida.");
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("LancamentoDeleteDialog: trigger revela AlertDialog com Excluir + Cancelar", async () => {
    mocks.excluirLancamento.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(
      <LancamentoDeleteDialog
        lancamento={{ id: "l1" }}
        trigger={
          <Button aria-label="Abrir excluir">Abrir</Button>
        }
      />
    );
    await user.click(screen.getByRole("button", { name: /abrir excluir/i }));
    expect(
      screen.getByRole("alertdialog", { name: /excluir lançamento/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancelar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^excluir$/i })
    ).toBeInTheDocument();
  });

  it("LancamentoEfetivarDialog: mostra valor formatado e despacha valor ajustado", async () => {
    mocks.efetivarLancamento.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(
      <LancamentoEfetivarDialog
        lancamento={{ id: "l1", valor: 10000, data: "2026-07-13" }}
        trigger={
          <Button aria-label="Abrir efetivar">Abrir</Button>
        }
      />
    );
    await user.click(screen.getByRole("button", { name: /abrir efetivar/i }));
    const input = screen.getByLabelText("Valor realizado") as HTMLInputElement;
    expect(input.value).toBe(formatarBRL(10000));
    await user.clear(input);
    await user.type(input, "20000");
    await user.click(screen.getByRole("button", { name: /^efetivar$/i }));
    await waitFor(() => {
      expect(mocks.efetivarLancamento).toHaveBeenCalledOnce();
    });
    const fd = mocks.efetivarLancamento.mock.calls[0][1] as FormData;
    expect(fd.get("id")).toBe("l1");
    expect(fd.get("valor")).toBe("20000");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Lançamento efetivado.");
  });
});

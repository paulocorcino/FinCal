import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LancamentoChip } from "@/components/agenda/lancamento-chip";
import type { LancamentoChipLancamento } from "@/components/agenda/lancamento-chip";

function row(overrides: Partial<LancamentoChipLancamento>): LancamentoChipLancamento {
  return {
    id: "l1",
    tipo: "DESPESA",
    valor: 123456,
    data: "2026-07-13",
    status: "EFETIVADO",
    transferenciaId: null,
    ...overrides,
  };
}

describe("LancamentoChip", () => {
  it("RECEITA EFETIVADO: data-tipo + sinal + data-atrasado false", () => {
    render(
      <LancamentoChip lancamento={row({ tipo: "RECEITA" })} hoje="2026-07-13" />
    );
    const chip = screen.getByRole("button");
    expect(chip).toHaveAttribute("data-tipo", "RECEITA");
    expect(chip).toHaveAttribute("data-status", "EFETIVADO");
    expect(chip).toHaveAttribute("data-atrasado", "false");
    expect(chip.textContent ?? "").toMatch(/^\+/);
  });

  it("DESPESA PENDENTE não-atrasado: sinal − e data-status PENDENTE", () => {
    render(
      <LancamentoChip
        lancamento={row({ tipo: "DESPESA", status: "PENDENTE", data: "2026-07-20" })}
        hoje="2026-07-13"
      />
    );
    const chip = screen.getByRole("button");
    expect(chip).toHaveAttribute("data-tipo", "DESPESA");
    expect(chip).toHaveAttribute("data-status", "PENDENTE");
    expect(chip).toHaveAttribute("data-atrasado", "false");
    expect(chip.textContent ?? "").match(/^\u2212/);
  });

  it("DESPESA PENDENTE atrasado: data-atrasado true, data-status continua PENDENTE, ring-amber-400", () => {
    render(
      <LancamentoChip
        lancamento={row({ tipo: "DESPESA", status: "PENDENTE", data: "2026-07-10" })}
        hoje="2026-07-13"
      />
    );
    const chip = screen.getByRole("button");
    expect(chip).toHaveAttribute("data-status", "PENDENTE");
    expect(chip).toHaveAttribute("data-atrasado", "true");
    expect(chip.className).toContain("ring-amber-400");
  });

  it("RECEITA EFETIVADO com data passada: nunca atrasado", () => {
    render(
      <LancamentoChip
        lancamento={row({ tipo: "RECEITA", status: "EFETIVADO", data: "2026-07-01" })}
        hoje="2026-07-13"
      />
    );
    const chip = screen.getByRole("button");
    expect(chip).toHaveAttribute("data-atrasado", "false");
  });

  it("TRANSFERENCIA: data-tipo TRANSFERENCIA, sem sinal", () => {
    render(
      <LancamentoChip
        lancamento={row({ tipo: "DESPESA", transferenciaId: "t1" })}
        hoje="2026-07-13"
      />
    );
    const chip = screen.getByRole("button");
    expect(chip).toHaveAttribute("data-tipo", "TRANSFERENCIA");
    expect(chip.textContent ?? "").not.match(/^[+\u2212]/);
  });

  it("clique chama onClick uma vez", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <LancamentoChip
        lancamento={row({ tipo: "RECEITA" })}
        hoje="2026-07-13"
        onClick={onClick}
      />
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

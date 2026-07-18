import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { formatarBRL, parseCentavos } from "@/lib/format";
import { CurrencyInput } from "@/components/ui/currency-input";

describe("format helpers", () => {
  it("formatarBRL formata centavos em R$ pt-BR", () => {
    expect(formatarBRL(123456)).toMatch(/^R\$\s1\.234,56$/);
  });

  it("formatarBRL preserva sinal negativo (CARTAO)", () => {
    expect(formatarBRL(-50000).startsWith("-")).toBe(true);
  });

  it("parseCentavos extrai centavos de texto com máscara", () => {
    expect(parseCentavos("R$ 1.234,56")).toBe(123456);
  });

  it("parseCentavos retorna 0 para string vazia", () => {
    expect(parseCentavos("")).toBe(0);
  });

  it("round-trip: formatarBRL(parseCentavos(...)) é estável", () => {
    const text = formatarBRL(98765);
    expect(parseCentavos(text)).toBe(98765);
  });
});

function Harness({ onChange }: { onChange: (cents: number) => void }) {
  const [value, setValue] = useState(0);
  return (
    <CurrencyInput
      value={value}
      onValueChange={(c) => {
        setValue(c);
        onChange(c);
      }}
      aria-label="valor"
    />
  );
}

describe("CurrencyInput", () => {
  it("exibe o valor formatado em R$", () => {
    render(
      <CurrencyInput
        value={123456}
        onValueChange={vi.fn()}
        aria-label="valor"
      />
    );
    const input = screen.getByLabelText("valor") as HTMLInputElement;
    expect(input.value).toBe(formatarBRL(123456));
  });

  it("emite integer cents ao digitar (round-trip controlado)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByLabelText("valor") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "2.000,00");
    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last).toBe(200000);
    expect(Number.isInteger(last)).toBe(true);
  });
});

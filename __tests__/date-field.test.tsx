import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DateField } from "@/components/ui/date-field";

describe("DateField", () => {
  it("exibe o valor inicial em dd/MM/yyyy e carrega yyyy-MM-dd no hidden field", () => {
    render(<DateField name="data" value="2026-07-13" aria-label="data" />);
    const visible = screen.getByLabelText("data") as HTMLInputElement;
    expect(visible.value).toBe("13/07/2026");
    expect(screen.getByDisplayValue("2026-07-13")).toBeInTheDocument();
  });

  it("digitando 13072026 exibe 13/07/2026 e carrega 2026-07-13", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateField name="data" aria-label="data" onChange={onChange} />);
    const input = screen.getByLabelText("data") as HTMLInputElement;
    await user.click(input);
    await user.type(input, "13072026");
    expect(input.value).toBe("13/07/2026");
    expect(screen.getByDisplayValue("2026-07-13")).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith("2026-07-13");
  });

  it("data inválida (31022026) deixa o hidden field vazio e emite null", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateField name="data" aria-label="data" onChange={onChange} />);
    const input = screen.getByLabelText("data") as HTMLInputElement;
    await user.click(input);
    await user.type(input, "31022026");
    expect(screen.queryByDisplayValue("2026-02-31")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

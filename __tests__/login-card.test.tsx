import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/auth-actions", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

import LoginPage, { AuthCard } from "@/app/login/page";

describe("LoginPage", () => {
  it("defaults to login mode (Entrar button, no Confirmar senha)", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("button", { name: /entrar/i })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirmar senha/i)).toBeNull();
  });

  it("toggles to register mode showing Confirmar senha and Registrar button", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(
      await screen.findByLabelText(/confirmar senha/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /registrar/i })
    ).toBeInTheDocument();
  });

  it("returns to login mode after toggling back", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /criar conta/i }));
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(screen.queryByLabelText(/confirmar senha/i)).toBeNull();
    expect(
      screen.getByRole("button", { name: /^entrar$/i })
    ).toBeInTheDocument();
  });
});

describe("AuthCard inline error", () => {
  it("renders role=alert with the literal message", () => {
    render(
      <AuthCard
        mode="login"
        state={{ error: "E-mail ou senha inválidos." }}
        formAction={vi.fn()}
        pending={false}
        onToggleMode={vi.fn()}
      />
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("E-mail ou senha inválidos.");
  });
});

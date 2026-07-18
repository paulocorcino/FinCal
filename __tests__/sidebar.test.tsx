import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockLogout } = vi.hoisted(() => ({ mockLogout: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/lib/auth-actions", () => ({
  logout: (...args: unknown[]) => mockLogout(...args),
}));

import { Sidebar } from "@/components/sidebar";

describe("Sidebar", () => {
  it("renders the 6 destinations in ui-ux.md order", () => {
    render(<Sidebar user={{ email: "demo@fincal.app" }} />);
    expect(screen.getAllByRole("link").map((a) => a.textContent?.trim())).toEqual(
      [
        "Dashboard",
        "Agenda",
        "Contas",
        "Categorias",
        "Importação Assistida",
        "Diagnóstico",
      ]
    );
  });

  it("user-menu trigger opens to expose a Sair menu item", async () => {
    const user = userEvent.setup();
    render(<Sidebar user={{ email: "demo@fincal.app" }} />);

    const trigger = screen.getByRole("button", {
      name: /conta|demo@fincal\.app/i,
    });
    await user.click(trigger);

    expect(
      await screen.findByRole("menuitem", { name: /sair/i })
    ).toBeInTheDocument();
  });

  it("clicking Sair invokes the logout server action", async () => {
    mockLogout.mockClear();
    const user = userEvent.setup();
    render(<Sidebar user={{ email: "demo@fincal.app" }} />);

    const trigger = screen.getByRole("button", {
      name: /conta|demo@fincal\.app/i,
    });
    await user.click(trigger);

    const sair = await screen.findByRole("menuitem", { name: /sair/i });
    await user.click(sair);

    await vi.waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
  });

  it("renders without user prop (generic trigger)", () => {
    render(<Sidebar />);
    expect(
      screen.getByRole("button", { name: /conta/i })
    ).toBeInTheDocument();
  });
});

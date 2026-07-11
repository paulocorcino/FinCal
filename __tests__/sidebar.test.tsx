import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/lib/auth-actions", () => ({
  logout: vi.fn(),
}));

import { Sidebar } from "@/components/sidebar";

describe("Sidebar", () => {
  it("renders the 6 destinations in ui-ux.md order", () => {
    render(<Sidebar />);
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
});

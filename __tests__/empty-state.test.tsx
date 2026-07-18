import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/empty-state";

describe("EmptyState", () => {
  it("renders icon + description + CTA button", () => {
    render(
      <EmptyState
        icon={<span data-testid="i" />}
        description="Nada por aqui ainda."
        action={{ label: "Criar sua primeira Conta" }}
      />
    );

    expect(screen.getByTestId("i")).toBeInTheDocument();
    expect(screen.getByText("Nada por aqui ainda.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Criar sua primeira Conta" })
    ).toBeInTheDocument();
  });
});

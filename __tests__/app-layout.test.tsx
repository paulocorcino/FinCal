import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

const mockAuth = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    mockRedirect(path);
    throw new Error(`NEXT_REDIRECT ${path}`);
  },
}));

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

import AppLayout from "@/app/(app)/layout";

describe("AppLayout", () => {
  it("redirects to /login when there is no session", async () => {
    mockAuth.mockResolvedValueOnce(null);
    mockRedirect.mockClear();

    await expect(AppLayout({ children: null })).rejects.toThrow(
      "NEXT_REDIRECT /login"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders AppShell when session.user exists", async () => {
    mockAuth.mockResolvedValueOnce({ user: { email: "x@y.z" } });
    mockRedirect.mockClear();

    const Comp = await AppLayout({ children: <p>page</p> });
    const { getByTestId, getByText } = render(Comp);

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(getByTestId("app-shell")).toBeInTheDocument();
    expect(getByText("page")).toBeInTheDocument();
  });
});

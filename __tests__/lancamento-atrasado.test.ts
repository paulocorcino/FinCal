import { describe, it, expect, vi, afterEach } from "vitest";
import { isAtrasado } from "@/lib/lancamento";
import { hojeAmericaSaoPaulo } from "@/lib/data";

describe("isAtrasado", () => {
  it("retorna true para PENDENTE com data no passado", () => {
    expect(isAtrasado({ status: "PENDENTE", data: "2026-07-12" }, "2026-07-13")).toBe(true);
  });

  it("retorna false para PENDENTE com data == hoje (hoje não é passado)", () => {
    expect(isAtrasado({ status: "PENDENTE", data: "2026-07-12" }, "2026-07-12")).toBe(false);
  });

  it("retorna false para EFETIVADO mesmo com data passada", () => {
    expect(isAtrasado({ status: "EFETIVADO", data: "2026-07-01" }, "2026-07-13")).toBe(false);
  });

  it("retorna false para PENDENTE futuro", () => {
    expect(isAtrasado({ status: "PENDENTE", data: "2026-07-14" }, "2026-07-13")).toBe(false);
  });
});

describe("hojeAmericaSaoPaulo — tz boundary", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("UTC 02:59:59 (SP 23:59:59 dia anterior) → retorna o dia anterior", () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 6, 13, 2, 59, 59) });
    expect(hojeAmericaSaoPaulo()).toBe("2026-07-12");
  });

  it("UTC 03:00:00 (SP 00:00:00 do dia) → retorna o dia", () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 6, 13, 3, 0, 0) });
    expect(hojeAmericaSaoPaulo()).toBe("2026-07-13");
  });
});

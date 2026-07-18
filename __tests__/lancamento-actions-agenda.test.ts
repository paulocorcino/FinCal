import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLancamentoFindMany } = vi.hoisted(() => ({
  mockLancamentoFindMany: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: () => Promise.resolve({ user: { id: "u1" } }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lancamento: {
      findMany: (...args: unknown[]) => mockLancamentoFindMany(...args),
    },
  },
}));

import { listarLancamentosDaAgenda } from "@/lib/lancamento-actions";

describe("listarLancamentosDaAgenda", () => {
  beforeEach(() => {
    mockLancamentoFindMany.mockReset();
  });

  it("consulta por userId + range do mes, ordenado por data asc", async () => {
    mockLancamentoFindMany.mockResolvedValueOnce([]);

    await listarLancamentosDaAgenda({ mesAno: "2026-07" });

    expect(mockLancamentoFindMany).toHaveBeenCalledWith({
      where: {
        userId: "u1",
        data: { gte: "2026-07-01", lte: "2026-07-31" },
      },
      orderBy: { data: "asc" },
    });
  });

  it("inclui contaId no where quando fornecido", async () => {
    mockLancamentoFindMany.mockResolvedValueOnce([]);

    await listarLancamentosDaAgenda({ mesAno: "2026-07", contaId: "c9" });

    expect(mockLancamentoFindMany).toHaveBeenCalledWith({
      where: {
        userId: "u1",
        data: { gte: "2026-07-01", lte: "2026-07-31" },
        contaId: "c9",
      },
      orderBy: { data: "asc" },
    });
  });

  it("fevereiro não-bissexto: fim = 28", async () => {
    mockLancamentoFindMany.mockResolvedValueOnce([]);

    await listarLancamentosDaAgenda({ mesAno: "2026-02" });

    expect(mockLancamentoFindMany).toHaveBeenCalledWith({
      where: {
        userId: "u1",
        data: { gte: "2026-02-01", lte: "2026-02-28" },
      },
      orderBy: { data: "asc" },
    });
  });
});

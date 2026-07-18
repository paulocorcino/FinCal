import { describe, it, expect, vi, beforeEach } from "vitest";
import { fimDoMesAtual } from "@/lib/saldo";

const { mockContaFindMany, mockLancamentoFindMany, mockHoje } = vi.hoisted(
  () => ({
    mockContaFindMany: vi.fn(),
    mockLancamentoFindMany: vi.fn(),
    mockHoje: vi.fn(),
  })
);

vi.mock("@/auth", () => ({
  auth: () => Promise.resolve({ user: { id: "u1" } }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    conta: {
      findMany: (...args: unknown[]) => mockContaFindMany(...args),
    },
    lancamento: {
      findMany: (...args: unknown[]) => mockLancamentoFindMany(...args),
    },
  },
}));

vi.mock("@/lib/data", () => ({
  hojeAmericaSaoPaulo: () => mockHoje(),
}));

import { obterSerieSaldos } from "@/lib/saldo-actions";

describe("obterSerieSaldos", () => {
  beforeEach(() => {
    mockContaFindMany.mockReset();
    mockLancamentoFindMany.mockReset();
    mockHoje.mockReset();
    mockHoje.mockReturnValue("2026-07-13");
  });

  it("consolidado: consulta por userId, atual exclui PENDENTE, projetado inclui", async () => {
    mockContaFindMany.mockResolvedValue([
      {
        id: "cA",
        userId: "u1",
        nome: "Banco A",
        papel: "CORRENTE",
        saldoInicial: 10000,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
      {
        id: "cB",
        userId: "u1",
        nome: "Banco B",
        papel: "CORRENTE",
        saldoInicial: 20000,
        createdAt: new Date("2026-01-02"),
        updatedAt: new Date("2026-01-02"),
      },
    ]);
    mockLancamentoFindMany.mockResolvedValue([
      {
        id: "l1",
        userId: "u1",
        contaId: "cA",
        categoriaId: "cat1",
        tipo: "RECEITA",
        valor: 5000,
        data: "2026-07-10",
        status: "EFETIVADO",
        recorrenciaId: null,
        transferenciaId: null,
        createdAt: new Date("2026-07-10"),
        updatedAt: new Date("2026-07-10"),
      },
      {
        id: "l2",
        userId: "u1",
        contaId: "cA",
        categoriaId: "cat2",
        tipo: "DESPESA",
        valor: 3000,
        data: "2026-07-20",
        status: "PENDENTE",
        recorrenciaId: null,
        transferenciaId: null,
        createdAt: new Date("2026-07-20"),
        updatedAt: new Date("2026-07-20"),
      },
    ]);

    const result = await obterSerieSaldos();

    expect(mockContaFindMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    });
    expect(mockLancamentoFindMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    });
    expect(result).not.toBeNull();
    expect(result!.atual).toBe(35000);
    expect(result!.projetado.at(-1)!.saldo).toBe(32000);
    expect(result!.projetado.at(-1)!.data).toBe("2026-07-31");
    expect(result!.primeiroDiaNegativo).toBeNull();
    expect(result!.horizonte).toBe("2026-07-31");
  });

  it("PENDENTE só no projetado: lançamento passado conta no projetado, não no atual", async () => {
    mockContaFindMany.mockResolvedValue([
      {
        id: "cA",
        userId: "u1",
        nome: "Banco A",
        papel: "CORRENTE",
        saldoInicial: 1000,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
    ]);
    mockLancamentoFindMany.mockResolvedValue([
      {
        id: "l1",
        userId: "u1",
        contaId: "cA",
        categoriaId: "cat1",
        tipo: "DESPESA",
        valor: 5000,
        data: "2026-07-13",
        status: "PENDENTE",
        recorrenciaId: null,
        transferenciaId: null,
        createdAt: new Date("2026-07-13"),
        updatedAt: new Date("2026-07-13"),
      },
    ]);

    const result = await obterSerieSaldos();

    expect(result!.atual).toBe(1000);
    expect(result!.projetado[0]).toEqual({
      data: "2026-07-13",
      saldo: -4000,
    });
    expect(result!.primeiroDiaNegativo).toBe("2026-07-13");
  });

  it("filtro por Conta: ambos findMany recebem id/contaId ao lado de userId", async () => {
    mockContaFindMany.mockResolvedValue([
      {
        id: "cA",
        userId: "u1",
        nome: "Banco A",
        papel: "CORRENTE",
        saldoInicial: 10000,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
    ]);
    mockLancamentoFindMany.mockResolvedValue([
      {
        id: "l1",
        userId: "u1",
        contaId: "cA",
        categoriaId: "cat1",
        tipo: "RECEITA",
        valor: 2000,
        data: "2026-07-10",
        status: "EFETIVADO",
        recorrenciaId: null,
        transferenciaId: null,
        createdAt: new Date("2026-07-10"),
        updatedAt: new Date("2026-07-10"),
      },
    ]);

    const result = await obterSerieSaldos({ contaId: "cA" });

    expect(mockContaFindMany).toHaveBeenCalledWith({
      where: { userId: "u1", id: "cA" },
    });
    expect(mockLancamentoFindMany).toHaveBeenCalledWith({
      where: { userId: "u1", contaId: "cA" },
    });
    expect(result!.atual).toBe(12000);
  });

  it("horizonte default = fimDoMesAtual(hoje)", async () => {
    mockHoje.mockReturnValue("2026-07-13");
    mockContaFindMany.mockResolvedValue([
      {
        id: "cA",
        userId: "u1",
        nome: "A",
        papel: "CORRENTE",
        saldoInicial: 1000,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
    ]);
    mockLancamentoFindMany.mockResolvedValue([]);

    const result = await obterSerieSaldos();

    expect(result!.horizonte).toBe(fimDoMesAtual("2026-07-13"));
    expect(result!.horizonte).toBe("2026-07-31");
  });

  it("horizonte override é honrado", async () => {
    mockContaFindMany.mockResolvedValue([
      {
        id: "cA",
        userId: "u1",
        nome: "A",
        papel: "CORRENTE",
        saldoInicial: 1000,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
    ]);
    mockLancamentoFindMany.mockResolvedValue([]);

    const result = await obterSerieSaldos({ horizonte: "2026-08-15" });

    expect(result!.horizonte).toBe("2026-08-15");
    expect(result!.projetado.at(-1)!.data).toBe("2026-08-15");
  });

  it("retorna null quando não há contas (não consulta lançamentos)", async () => {
    mockContaFindMany.mockResolvedValue([]);

    const result = await obterSerieSaldos();

    expect(result).toBeNull();
    expect(mockLancamentoFindMany).not.toHaveBeenCalled();
  });
});

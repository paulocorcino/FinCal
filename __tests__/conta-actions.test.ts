import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockFindMany,
  mockCreate,
  mockUpdateMany,
  mockDeleteMany,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockDeleteMany: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: () => Promise.resolve({ user: { id: "u1" } }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    conta: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
  },
}));

import {
  listarContas,
  criarConta,
  editarConta,
  excluirConta,
} from "@/lib/conta-actions";

describe("conta-actions", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockCreate.mockReset();
    mockUpdateMany.mockReset();
    mockDeleteMany.mockReset();
  });

  it("listarContas consulta por userId e deriva saldoAtual === saldoInicial", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "c1",
        userId: "u1",
        nome: "Nubank",
        papel: "CORRENTE",
        saldoInicial: 10000,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
    ]);

    const result = await listarContas();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { createdAt: "asc" },
    });
    expect(result[0].saldoAtual).toBe(10000);
  });

  it("criarConta chama prisma.conta.create com userId derivado da sessão", async () => {
    mockCreate.mockResolvedValueOnce({ id: "c1" });
    const fd = new FormData();
    fd.set("nome", "Nubank");
    fd.set("papel", "CORRENTE");
    fd.set("saldoInicial", "10000");

    await criarConta(undefined, fd);

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        nome: "Nubank",
        papel: "CORRENTE",
        saldoInicial: 10000,
      },
    });
  });

  it("criarConta rejeita papel inválido e NÃO grava", async () => {
    const fd = new FormData();
    fd.set("nome", "Carteira");
    fd.set("papel", "CARTEIRA");
    fd.set("saldoInicial", "10000");

    const result = await criarConta(undefined, fd);

    expect(result).toEqual({ error: "Papel inválido." });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("criarConta rejeita saldoInicial não-inteiro e NÃO grava", async () => {
    const fd = new FormData();
    fd.set("nome", "X");
    fd.set("papel", "CORRENTE");
    fd.set("saldoInicial", "100.5");

    const result = await criarConta(undefined, fd);

    expect(result?.error).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("editarConta própria: updateMany com where { id, userId } + data", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 });
    const fd = new FormData();
    fd.set("id", "c1");
    fd.set("nome", "Nubank Nova");
    fd.set("papel", "RESERVA");
    fd.set("saldoInicial", "20000");

    await editarConta(undefined, fd);

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "c1", userId: "u1" },
      data: {
        nome: "Nubank Nova",
        papel: "RESERVA",
        saldoInicial: 20000,
      },
    });
  });

  it("editarConta alheia: count===0 → error, sem vazar existência", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 0 });
    const fd = new FormData();
    fd.set("id", "c1");
    fd.set("nome", "X");
    fd.set("papel", "CORRENTE");
    fd.set("saldoInicial", "10000");

    const result = await editarConta(undefined, fd);

    expect(result).toEqual({ error: "Conta não encontrada." });
  });

  it("excluirConta própria: deleteMany({ where: { id, userId } }) count===1", async () => {
    mockDeleteMany.mockResolvedValueOnce({ count: 1 });
    const fd = new FormData();
    fd.set("id", "c1");

    await excluirConta(undefined, fd);

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { id: "c1", userId: "u1" },
    });
  });

  it("excluirConta alheia: count===0 → error", async () => {
    mockDeleteMany.mockResolvedValueOnce({ count: 0 });
    const fd = new FormData();
    fd.set("id", "c1");

    const result = await excluirConta(undefined, fd);

    expect(result).toEqual({ error: "Conta não encontrada." });
  });
});

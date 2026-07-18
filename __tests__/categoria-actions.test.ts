import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockFindMany,
  mockCreate,
  mockUpdateMany,
  mockDeleteMany,
  mockLancamentoCount,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockLancamentoCount: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: () => Promise.resolve({ user: { id: "u1" } }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    categoria: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
    lancamento: {
      count: (...args: unknown[]) => mockLancamentoCount(...args),
    },
  },
}));

import {
  listarCategorias,
  criarCategoria,
  editarCategoria,
  excluirCategoria,
} from "@/lib/categoria-actions";

describe("categoria-actions", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockCreate.mockReset();
    mockUpdateMany.mockReset();
    mockDeleteMany.mockReset();
    mockLancamentoCount.mockReset();
    mockLancamentoCount.mockResolvedValue(0);
  });

  it("listarCategorias consulta por userId ordenado por createdAt asc", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await listarCategorias();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { createdAt: "asc" },
    });
  });

  it("criarCategoria persiste nome + tipo com cor/icone null quando ausentes", async () => {
    mockCreate.mockResolvedValueOnce({ id: "c1" });
    const fd = new FormData();
    fd.set("nome", "Moradia");
    fd.set("tipo", "DESPESA");

    await criarCategoria(undefined, fd);

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        nome: "Moradia",
        tipo: "DESPESA",
        cor: null,
        icone: null,
      },
    });
  });

  it("criarCategoria persiste cor quando fornecida", async () => {
    mockCreate.mockResolvedValueOnce({ id: "c1" });
    const fd = new FormData();
    fd.set("nome", "X");
    fd.set("tipo", "RECEITA");
    fd.set("cor", "#71717a");

    await criarCategoria(undefined, fd);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        nome: "X",
        tipo: "RECEITA",
        cor: "#71717a",
        icone: null,
      },
    });
  });

  it("criarCategoria rejeita tipo inválido e NÃO grava", async () => {
    const fd = new FormData();
    fd.set("nome", "X");
    fd.set("tipo", "FOO");

    const result = await criarCategoria(undefined, fd);

    expect(result).toEqual({ error: "Tipo inválido." });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("criarCategoria rejeita cor malformada e NÃO grava", async () => {
    const fd = new FormData();
    fd.set("nome", "X");
    fd.set("tipo", "RECEITA");
    fd.set("cor", "red");

    const result = await criarCategoria(undefined, fd);

    expect(result).toEqual({ error: "Cor inválida." });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("criarCategoria mapeia P2002 para mensagem amigável", async () => {
    mockCreate.mockRejectedValueOnce({ code: "P2002" });
    const fd = new FormData();
    fd.set("nome", "Salário");
    fd.set("tipo", "RECEITA");

    const result = await criarCategoria(undefined, fd);

    expect(result).toEqual({
      error: "Já existe uma categoria com esse nome e tipo.",
    });
  });

  it("editarCategoria própria: updateMany com where { id, userId } + data", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 });
    const fd = new FormData();
    fd.set("id", "c1");
    fd.set("nome", "Moradia Nova");
    fd.set("tipo", "DESPESA");
    fd.set("cor", "#71717a");

    await editarCategoria(undefined, fd);

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "c1", userId: "u1" },
      data: {
        nome: "Moradia Nova",
        tipo: "DESPESA",
        cor: "#71717a",
        icone: null,
      },
    });
  });

  it("editarCategoria mapeia P2002 para mensagem amigável", async () => {
    mockUpdateMany.mockRejectedValueOnce({ code: "P2002" });
    const fd = new FormData();
    fd.set("id", "c1");
    fd.set("nome", "Salário");
    fd.set("tipo", "RECEITA");

    const result = await editarCategoria(undefined, fd);

    expect(result).toEqual({
      error: "Já existe uma categoria com esse nome e tipo.",
    });
  });

  it("editarCategoria alheia: count===0 → não encontrada", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 0 });
    const fd = new FormData();
    fd.set("id", "c1");
    fd.set("nome", "X");
    fd.set("tipo", "DESPESA");

    const result = await editarCategoria(undefined, fd);

    expect(result).toEqual({ error: "Categoria não encontrada." });
  });

  it("excluirCategoria própria: deleteMany({ where: { id, userId } })", async () => {
    mockLancamentoCount.mockResolvedValueOnce(0);
    mockDeleteMany.mockResolvedValueOnce({ count: 1 });
    const fd = new FormData();
    fd.set("id", "c1");

    await excluirCategoria(undefined, fd);

    expect(mockLancamentoCount).toHaveBeenCalledWith({
      where: { categoriaId: "c1", userId: "u1" },
    });
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { id: "c1", userId: "u1" },
    });
  });

  it("excluirCategoria alheia: count===0 → não encontrada", async () => {
    mockLancamentoCount.mockResolvedValueOnce(0);
    mockDeleteMany.mockResolvedValueOnce({ count: 0 });
    const fd = new FormData();
    fd.set("id", "c1");

    const result = await excluirCategoria(undefined, fd);

    expect(result).toEqual({ error: "Categoria não encontrada." });
  });

  it("excluirCategoria com Lançamentos vinculados: pre-check retorna erro amigável", async () => {
    mockLancamentoCount.mockResolvedValueOnce(1);
    const fd = new FormData();
    fd.set("id", "c1");

    const result = await excluirCategoria(undefined, fd);

    expect(result).toEqual({
      error: "Categoria possui Lançamentos vinculados.",
    });
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
});

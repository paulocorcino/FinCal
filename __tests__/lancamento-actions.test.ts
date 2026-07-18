import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockLancamentoFindMany,
  mockLancamentoCreate,
  mockLancamentoUpdateMany,
  mockLancamentoDeleteMany,
  mockLancamentoFindFirst,
  mockContaFindFirst,
  mockCategoriaFindFirst,
} = vi.hoisted(() => ({
  mockLancamentoFindMany: vi.fn(),
  mockLancamentoCreate: vi.fn(),
  mockLancamentoUpdateMany: vi.fn(),
  mockLancamentoDeleteMany: vi.fn(),
  mockLancamentoFindFirst: vi.fn(),
  mockContaFindFirst: vi.fn(),
  mockCategoriaFindFirst: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: () => Promise.resolve({ user: { id: "u1" } }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lancamento: {
      findMany: (...args: unknown[]) => mockLancamentoFindMany(...args),
      create: (...args: unknown[]) => mockLancamentoCreate(...args),
      updateMany: (...args: unknown[]) => mockLancamentoUpdateMany(...args),
      deleteMany: (...args: unknown[]) => mockLancamentoDeleteMany(...args),
      findFirst: (...args: unknown[]) => mockLancamentoFindFirst(...args),
    },
    conta: {
      findFirst: (...args: unknown[]) => mockContaFindFirst(...args),
    },
    categoria: {
      findFirst: (...args: unknown[]) => mockCategoriaFindFirst(...args),
    },
  },
}));

import {
  listarLancamentos,
  criarLancamento,
  editarLancamento,
  excluirLancamento,
  efetivarLancamento,
} from "@/lib/lancamento-actions";
import { statusDefaultPorData } from "@/lib/lancamento";
import { hojeAmericaSaoPaulo } from "@/lib/data";

describe("lancamento domain helpers", () => {
  it("statusDefaultPorData retorna EFETIVADO para passado/hj, PENDENTE para futuro", () => {
    expect(statusDefaultPorData("2026-07-12", "2026-07-13")).toBe("EFETIVADO");
    expect(statusDefaultPorData("2026-07-13", "2026-07-13")).toBe("EFETIVADO");
    expect(statusDefaultPorData("2026-07-14", "2026-07-13")).toBe("PENDENTE");
  });

  it("hojeAmericaSaoPaulo produz yyyy-MM-dd sem tempo/tz", () => {
    expect(hojeAmericaSaoPaulo()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("lancamento-actions", () => {
  beforeEach(() => {
    mockLancamentoFindMany.mockReset();
    mockLancamentoCreate.mockReset();
    mockLancamentoUpdateMany.mockReset();
    mockLancamentoDeleteMany.mockReset();
    mockLancamentoFindFirst.mockReset();
    mockContaFindFirst.mockReset();
    mockCategoriaFindFirst.mockReset();
  });

  it("listarLancamentos consulta por userId ordenado por data asc", async () => {
    mockLancamentoFindMany.mockResolvedValueOnce([]);

    await listarLancamentos();

    expect(mockLancamentoFindMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { data: "asc" },
    });
  });

  it("criarLancamento persiste valor inteiro (centavos) com userId da sessão", async () => {
    mockContaFindFirst.mockResolvedValueOnce({ id: "c1" });
    mockCategoriaFindFirst.mockResolvedValueOnce({ id: "cat1", tipo: "DESPESA" });
    mockLancamentoCreate.mockResolvedValueOnce({ id: "l1" });
    const fd = new FormData();
    fd.set("tipo", "DESPESA");
    fd.set("valor", "123456");
    fd.set("data", "2026-07-13");
    fd.set("contaId", "c1");
    fd.set("categoriaId", "cat1");

    await criarLancamento(undefined, fd);

    expect(mockLancamentoCreate).toHaveBeenCalledOnce();
    expect(mockLancamentoCreate).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        contaId: "c1",
        categoriaId: "cat1",
        tipo: "DESPESA",
        valor: 123456,
        data: "2026-07-13",
        status: expect.any(String),
      },
    });
  });

  it("criarLancamento rejeita valor não-inteiro e NÃO grava", async () => {
    const fd = new FormData();
    fd.set("tipo", "DESPESA");
    fd.set("valor", "100.5");
    fd.set("data", "2026-07-13");
    fd.set("contaId", "c1");
    fd.set("categoriaId", "cat1");

    const result = await criarLancamento(undefined, fd);

    expect(result).toEqual({ error: "Valor inválido." });
    expect(mockLancamentoCreate).not.toHaveBeenCalled();
  });

  it("criarLancamento rejeita tipo inválido e NÃO grava", async () => {
    const fd = new FormData();
    fd.set("tipo", "FOO");
    fd.set("valor", "100");
    fd.set("data", "2026-07-13");
    fd.set("contaId", "c1");
    fd.set("categoriaId", "cat1");

    const result = await criarLancamento(undefined, fd);

    expect(result).toEqual({ error: "Tipo inválido." });
    expect(mockLancamentoCreate).not.toHaveBeenCalled();
  });

  it("criarLancamento rejeita data inválida e NÃO grava", async () => {
    const fd = new FormData();
    fd.set("tipo", "DESPESA");
    fd.set("valor", "100");
    fd.set("data", "2026-13-40");
    fd.set("contaId", "c1");
    fd.set("categoriaId", "cat1");

    const result = await criarLancamento(undefined, fd);

    expect(result).toEqual({ error: "Data inválida." });
    expect(mockLancamentoCreate).not.toHaveBeenCalled();
  });

  it("criarLancamento rejeita quando conta não pertence ao usuário", async () => {
    mockContaFindFirst.mockResolvedValueOnce(null);
    const fd = new FormData();
    fd.set("tipo", "DESPESA");
    fd.set("valor", "100");
    fd.set("data", "2026-07-13");
    fd.set("contaId", "c1");
    fd.set("categoriaId", "cat1");

    const result = await criarLancamento(undefined, fd);

    expect(result).toEqual({ error: "Conta não encontrada." });
    expect(mockLancamentoCreate).not.toHaveBeenCalled();
  });

  it("criarLancamento rejeita quando categoria.tipo != tipo", async () => {
    mockContaFindFirst.mockResolvedValueOnce({ id: "c1" });
    mockCategoriaFindFirst.mockResolvedValueOnce({ id: "cat1", tipo: "RECEITA" });
    const fd = new FormData();
    fd.set("tipo", "DESPESA");
    fd.set("valor", "100");
    fd.set("data", "2026-07-13");
    fd.set("contaId", "c1");
    fd.set("categoriaId", "cat1");

    const result = await criarLancamento(undefined, fd);

    expect(result).toEqual({
      error: "Categoria não corresponde ao tipo do Lançamento.",
    });
    expect(mockLancamentoCreate).not.toHaveBeenCalled();
  });

  it("editarLancamento alheia: count===0 → não encontrado", async () => {
    mockContaFindFirst.mockResolvedValueOnce({ id: "c1" });
    mockCategoriaFindFirst.mockResolvedValueOnce({ id: "cat1", tipo: "DESPESA" });
    mockLancamentoUpdateMany.mockResolvedValueOnce({ count: 0 });
    const fd = new FormData();
    fd.set("id", "l1");
    fd.set("tipo", "DESPESA");
    fd.set("valor", "100");
    fd.set("data", "2026-07-13");
    fd.set("contaId", "c1");
    fd.set("categoriaId", "cat1");

    const result = await editarLancamento(undefined, fd);

    expect(result).toEqual({ error: "Lançamento não encontrado." });
  });

  it("excluirLancamento própria: deleteMany({ where: { id, userId } })", async () => {
    mockLancamentoDeleteMany.mockResolvedValueOnce({ count: 1 });
    const fd = new FormData();
    fd.set("id", "l1");

    await excluirLancamento(undefined, fd);

    expect(mockLancamentoDeleteMany).toHaveBeenCalledWith({
      where: { id: "l1", userId: "u1" },
    });
  });

  it("efetivarLancamento PENDENTE + valor ajustado: updateMany scoped by PENDENTE", async () => {
    mockLancamentoUpdateMany.mockResolvedValueOnce({ count: 1 });
    const fd = new FormData();
    fd.set("id", "l1");
    fd.set("valor", "99999");

    await efetivarLancamento(undefined, fd);

    expect(mockLancamentoUpdateMany).toHaveBeenCalledWith({
      where: { id: "l1", userId: "u1", status: "PENDENTE" },
      data: { status: "EFETIVADO", valor: 99999 },
    });
  });

  it("efetivarLancamento já-EFETIVADO: count===0 + findFirst EFETIVADO → já efetivado", async () => {
    mockLancamentoUpdateMany.mockResolvedValueOnce({ count: 0 });
    mockLancamentoFindFirst.mockResolvedValueOnce({ status: "EFETIVADO" });
    const fd = new FormData();
    fd.set("id", "l1");

    const result = await efetivarLancamento(undefined, fd);

    expect(result).toEqual({ error: "Lançamento já efetivado." });
  });

  it("efetivarLancamento inexistente: count===0 + findFirst null → não encontrado", async () => {
    mockLancamentoUpdateMany.mockResolvedValueOnce({ count: 0 });
    mockLancamentoFindFirst.mockResolvedValueOnce(null);
    const fd = new FormData();
    fd.set("id", "l1");

    const result = await efetivarLancamento(undefined, fd);

    expect(result).toEqual({ error: "Lançamento não encontrado." });
  });
});

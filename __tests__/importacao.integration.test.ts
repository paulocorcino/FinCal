import { describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { signup } from "../app/actions/auth";
import { createConta } from "../lib/contas";
import { getCategoriesByUser } from "../lib/categories";
import { prisma } from "../lib/prisma";
import {
  createLancamento,
  parseDataLancamento,
} from "../lib/lancamentos";
import {
  extrairCandidatosAction,
  confirmarImportacaoAction,
} from "../app/actions/importacao";
import { StatusLancamento } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const createFn = vi.fn();
const mockOpenAI = {
  chat: {
    completions: {
      create: createFn,
    },
  },
};

vi.mock("openai", () => ({
  default: vi.fn(() => mockOpenAI),
}));

async function createUserForm(email: string, password: string) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  return form;
}

async function setupUser(email: string) {
  await signup(await createUserForm(email, "password123"));
  const user = await prisma.user.findUnique({ where: { email } });
  expect(user).not.toBeNull();
  return user!;
}

function aiResponse(candidatos: Record<string, unknown>[]) {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({ candidatos }),
        },
      },
    ],
  };
}

describe("importacao integration", () => {
  it("returns candidates from a CSV upload and flags duplicates", async () => {
    const email = "importacao-dup@example.com";
    const user = await setupUser(email);
    const conta = await createConta(user.id, {
      nome: "Conta Corrente",
      saldoInicial: 0,
      papel: "CORRENTE",
    });
    const categorias = await getCategoriesByUser(user.id);
    const alimentacao = categorias.find((c) => c.nome === "Alimentação")!;

    await createLancamento(user.id, {
      tipo: "DESPESA",
      valor: 5000,
      data: parseDataLancamento("2026-07-08"),
      contaId: conta.id,
      categoriaId: alimentacao.id,
    });

    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email },
    } as unknown as ReturnType<typeof auth>);

    createFn.mockResolvedValueOnce(
      aiResponse([
        {
          data: "2026-07-08",
          valorEmReais: 50,
          descricao: "Mercado",
          tipo: "DESPESA",
          categoriaSugerida: "Alimentação",
        },
        {
          data: "2026-07-09",
          valorEmReais: 30,
          descricao: "Padaria",
          tipo: "DESPESA",
          categoriaSugerida: "Alimentação",
        },
      ]),
    );

    const form = new FormData();
    form.append("contaId", conta.id);
    form.append(
      "arquivo",
      new File(["data,valor,descricao\n2026-07-08,50,Mercado\n2026-07-09,30,Padaria"], "test.csv", {
        type: "text/csv",
      }),
    );

    const result = await extrairCandidatosAction(form);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.candidatos).toHaveLength(2);
    const mercado = result.candidatos.find((c) => c.descricao === "Mercado")!;
    const padaria = result.candidatos.find((c) => c.descricao === "Padaria")!;

    expect(mercado.duplicado).toBe(true);
    expect(padaria.duplicado).toBe(false);
    expect(mercado.categoriaId).toBe(alimentacao.id);
  });

  it("creates EFETIVADO Lancamento records only after confirmation", async () => {
    const email = "importacao-confirm@example.com";
    const user = await setupUser(email);
    const conta = await createConta(user.id, {
      nome: "Conta Corrente",
      saldoInicial: 0,
      papel: "CORRENTE",
    });
    const categorias = await getCategoriesByUser(user.id);
    const salario = categorias.find((c) => c.nome === "Salário")!;

    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email },
    } as unknown as ReturnType<typeof auth>);

    createFn.mockResolvedValueOnce(
      aiResponse([
        {
          data: "2026-07-10",
          valorEmReais: 2500,
          descricao: "Salário",
          tipo: "RECEITA",
          categoriaSugerida: "Salário",
        },
      ]),
    );

    const uploadForm = new FormData();
    uploadForm.append("contaId", conta.id);
    uploadForm.append(
      "arquivo",
      new File(["data,valor,descricao\n2026-07-10,2500,Salário"], "test.csv", {
        type: "text/csv",
      }),
    );

    const extractResult = await extrairCandidatosAction(uploadForm);
    expect(extractResult.success).toBe(true);
    if (!extractResult.success) return;

    const beforeCount = await prisma.lancamento.count({
      where: { userId: user.id, contaId: conta.id },
    });
    expect(beforeCount).toBe(0);

    const confirmForm = new FormData();
    confirmForm.append("contaId", conta.id);
    confirmForm.append("candidatos", JSON.stringify(extractResult.candidatos));

    const confirmResult = await confirmarImportacaoAction(confirmForm);
    expect(confirmResult.success).toBe(true);
    if (!confirmResult.success) return;
    expect(confirmResult.count).toBe(1);

    const lancamentos = await prisma.lancamento.findMany({
      where: { userId: user.id, contaId: conta.id },
    });
    expect(lancamentos).toHaveLength(1);
    expect(lancamentos[0].status).toBe(StatusLancamento.EFETIVADO);
    expect(lancamentos[0].valor).toBe(250000);
    expect(lancamentos[0].categoriaId).toBe(salario.id);
  });
});

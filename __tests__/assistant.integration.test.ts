import { describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { signup } from "../app/actions/auth";
import { createConta } from "../lib/contas";
import { getCategoriesByUser } from "../lib/categories";
import { prisma } from "../lib/prisma";
import {
  createRecorrencia,
  materializarRecorrencias,
} from "../lib/recorrencias";
import { sendAssistantMessage } from "../app/actions/assistant";
import { FrequenciaRecorrencia, TipoLancamento } from "@prisma/client";
import { toSPDateString } from "../lib/saldo";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
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

async function setupContaECategorias(userId: string) {
  const conta = await createConta(userId, {
    nome: "Conta Corrente",
    saldoInicial: 0,
    papel: "CORRENTE",
  });
  const categorias = await getCategoriesByUser(userId);
  const despesa = categorias.find((c) => c.tipo === "DESPESA")!;
  return { conta, despesa };
}

function toolCallResponse(
  toolName: string,
  args: Record<string, unknown>,
  callId = "call-1",
) {
  return {
    choices: [
      {
        message: {
          role: "assistant" as const,
          tool_calls: [
            {
              id: callId,
              type: "function" as const,
              function: {
                name: toolName,
                arguments: JSON.stringify(args),
              },
            },
          ],
        },
      },
    ],
  };
}

function textResponse(text: string) {
  return {
    choices: [
      {
        message: {
          role: "assistant" as const,
          content: text,
        },
      },
    ],
  };
}

describe("assistant integration", () => {
  it("executa leitura de lançamentos recorrentes do mês", async () => {
    const email = "assistant-read@example.com";
    const user = await setupUser(email);
    const { conta, despesa } = await setupContaECategorias(user.id);

    const hoje = new Date();
    const start = toSPDateString(
      new Date(hoje.getFullYear(), hoje.getMonth(), 1),
    );
    const end = toSPDateString(
      new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0),
    );

    const recorrencia = await createRecorrencia(user.id, {
      tipo: TipoLancamento.DESPESA,
      valor: 100000,
      dataInicio: start,
      frequencia: FrequenciaRecorrencia.MENSAL,
      dia: 10,
      contaId: conta.id,
      categoriaId: despesa.id,
    });

    await materializarRecorrencias(user.id, { start, end });

    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email },
    } as unknown as ReturnType<typeof auth>);

    createFn
      .mockResolvedValueOnce(
        toolCallResponse("listarLancamentos", {
          start,
          end,
          somenteRecorrentes: true,
        }),
      )
      .mockResolvedValueOnce(
        textResponse("Você tem uma despesa recorrente de R$ 1.000,00."),
      );

    const result = await sendAssistantMessage({
      messages: [
        {
          role: "user",
          content: "mostre minhas despesas recorrentes deste mês",
        },
      ],
      pendingConfirmation: undefined,
      confirmed: false,
    });

    expect("error" in result).toBe(false);
    expect((result as { message: string }).message).toContain("R$ 1.000");

    const lancamentos = await prisma.lancamento.findMany({
      where: { userId: user.id },
    });
    expect(lancamentos).toHaveLength(1);
    expect(lancamentos[0].recorrenciaId).toBe(recorrencia.id);
  });

  it("cria recorrência após confirmação e não antes", async () => {
    const email = "assistant-write@example.com";
    const user = await setupUser(email);
    const { conta, despesa } = await setupContaECategorias(user.id);

    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email },
    } as unknown as ReturnType<typeof auth>);

    const args = {
      tipo: "DESPESA",
      valorEmReais: 2500,
      dataInicio: "2099-08-10",
      frequencia: "MENSAL",
      dia: 10,
      contaNome: conta.nome,
      categoriaNome: despesa.nome,
    };

    createFn.mockResolvedValueOnce(
      toolCallResponse("criarRecorrencia", args),
    );

    const first = await sendAssistantMessage({
      messages: [
        {
          role: "user",
          content: "cadastre o aluguel de R$ 2.500 todo dia 10",
        },
      ],
      pendingConfirmation: undefined,
      confirmed: false,
    });

    expect("error" in first).toBe(false);
    expect((first as { pendingConfirmation?: unknown }).pendingConfirmation).toBeDefined();

    const recorrenciasAntes = await prisma.recorrencia.findMany({
      where: { userId: user.id },
    });
    expect(recorrenciasAntes).toHaveLength(0);

    createFn.mockResolvedValueOnce(
      textResponse("Recorrência de aluguel criada com sucesso."),
    );

    const second = await sendAssistantMessage({
      messages: [
        { role: "user", content: "cadastre o aluguel de R$ 2.500 todo dia 10" },
        {
          role: "assistant",
          content: (first as { message: string }).message,
        },
      ],
      pendingConfirmation: (first as { pendingConfirmation: { tool: string; args: Record<string, unknown>; summary: string } }).pendingConfirmation,
      confirmed: true,
    });

    expect("error" in second).toBe(false);

    const recorrencia = await prisma.recorrencia.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(recorrencia.valor).toBe(250000);
    expect(recorrencia.dia).toBe(10);
    expect(recorrencia.contaId).toBe(conta.id);
    expect(recorrencia.categoriaId).toBe(despesa.id);
  });
});

import { describe, expect, it, vi } from "vitest";
import { processAssistantChat } from "@/lib/assistant/orchestrator";
import { executeTool } from "@/lib/assistant/tool-executor";
import { getContasByUser } from "@/lib/contas";
import { getCategoriesByUser } from "@/lib/categories";
import type OpenAI from "openai";

vi.mock("@/lib/contas", () => ({
  getContasByUser: vi.fn(),
}));

vi.mock("@/lib/categories", () => ({
  getCategoriesByUser: vi.fn(),
}));

function fakeOpenAI(calls: ReturnType<typeof vi.fn>) {
  return {
    chat: {
      completions: {
        create: calls,
      },
    },
  } as unknown as OpenAI;
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

describe("assistant orchestrator", () => {
  it("executa leitura e retorna resultado no texto do assistente", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        toolCallResponse("listarLancamentos", {
          start: "2026-07-01",
          end: "2026-07-31",
        }),
      )
      .mockResolvedValueOnce(textResponse("Você tem uma despesa de R$ 1.000."));

    const executor = vi.fn().mockResolvedValue({
      type: "success" as const,
      content: JSON.stringify([
        {
          id: "l1",
          tipo: "DESPESA",
          valor: 100000,
          data: "2026-07-10",
          status: "PENDENTE",
          conta: "Conta Corrente",
          categoria: "Moradia",
          recorrente: true,
        },
      ]),
    });

    const result = await processAssistantChat(
      {
        messages: [
          { role: "user", content: "mostre minhas despesas recorrentes" },
        ],
      },
      {
        openai: fakeOpenAI(create),
        executeTool: executor,
        userId: "u1",
      },
    );

    expect(executor).toHaveBeenCalledWith(
      "u1",
      "listarLancamentos",
      expect.objectContaining({ start: "2026-07-01", end: "2026-07-31" }),
    );
    expect(result.message).toContain("R$ 1.000");
    expect(result.pendingConfirmation).toBeUndefined();
  });

  it("retorna pendingConfirmation para escrita sem executar", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        toolCallResponse("criarRecorrencia", {
          tipo: "DESPESA",
          valorEmReais: 2500,
          dataInicio: "2026-08-10",
          frequencia: "MENSAL",
          dia: 10,
          contaNome: "Conta Corrente",
          categoriaNome: "Moradia",
        }),
      );

    const executor = vi.fn().mockResolvedValue({
      type: "needs_confirmation" as const,
      summary:
        "Recorrência de despesa de R$ 2.500,00 em Conta Corrente (Moradia), mensal, dia 10",
      tool: "criarRecorrencia" as const,
      args: { tipo: "DESPESA" },
    });

    const result = await processAssistantChat(
      {
        messages: [
          {
            role: "user",
            content: "cadastre o aluguel de R$ 2.500 todo dia 10",
          },
        ],
      },
      {
        openai: fakeOpenAI(create),
        executeTool: executor,
        userId: "u1",
      },
    );

    expect(result.pendingConfirmation).toBeDefined();
    expect(result.message).toContain("Confirma");
  });

  it("executa escrita quando confirmado", async () => {
    const create = vi.fn().mockResolvedValueOnce(textResponse("Lançamento criado."));

    const executor = vi.fn().mockResolvedValue({
      type: "success" as const,
      content: "Lançamento criado.",
    });

    const result = await processAssistantChat(
      {
        messages: [{ role: "user", content: "crie uma despesa" }],
        pendingConfirmation: {
          tool: "criarLancamento",
          args: {
            tipo: "DESPESA",
            valorEmReais: 100,
            data: "2026-07-10",
            contaNome: "Conta Corrente",
            categoriaNome: "Moradia",
          },
          summary: "Despesa de R$ 100,00 em Conta Corrente (Moradia)",
        },
        confirmed: true,
      },
      {
        openai: fakeOpenAI(create),
        executeTool: executor,
        userId: "u1",
      },
    );

    expect(executor).toHaveBeenLastCalledWith(
      "u1",
      "criarLancamento",
      expect.objectContaining({ contaNome: "Conta Corrente" }),
      true,
    );
    expect(result.message).toBe("Lançamento criado.");
    expect(result.pendingConfirmation).toBeUndefined();
  });
});

describe("assistant tool executor", () => {
  it("pergunta quando a conta não é encontrada", async () => {
    vi.mocked(getContasByUser).mockResolvedValue([]);
    vi.mocked(getCategoriesByUser).mockResolvedValue([
      {
        id: "cat1",
        nome: "Moradia",
        tipo: "DESPESA",
        userId: "u1",
      },
    ] as Awaited<ReturnType<typeof getCategoriesByUser>>);

    const result = await executeTool("u1", "criarLancamento", {
      tipo: "DESPESA",
      valorEmReais: 100,
      data: "2026-07-10",
      contaNome: "Inexistente",
      categoriaNome: "Moradia",
    });

    expect(result.type).toBe("error");
    expect(result.type === "error" && result.message).toContain(
      "Não encontrei a conta",
    );
  });

  it("pergunta quando a categoria não é encontrada", async () => {
    vi.mocked(getContasByUser).mockResolvedValue([
      {
        id: "conta1",
        nome: "Conta Corrente",
        saldoInicial: 0,
        papel: "CORRENTE",
        userId: "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as Awaited<ReturnType<typeof getContasByUser>>);
    vi.mocked(getCategoriesByUser).mockResolvedValue([]);

    const result = await executeTool("u1", "criarLancamento", {
      tipo: "DESPESA",
      valorEmReais: 100,
      data: "2026-07-10",
      contaNome: "Conta Corrente",
      categoriaNome: "Inexistente",
    });

    expect(result.type).toBe("error");
    expect(result.type === "error" && result.message).toContain(
      "Não encontrei a categoria",
    );
  });
});

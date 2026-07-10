import type OpenAI from "openai";
import { tools } from "@/lib/assistant/tools";
import { executeTool } from "@/lib/assistant/tool-executor";
import type {
  AssistantChatInput,
  AssistantChatResult,
  AssistantToolName,
  ChatMessage,
  PendingConfirmation,
} from "@/lib/assistant/types";
import { getOpenAIModel } from "@/lib/assistant/openai";

export type AssistantDeps = {
  openai: OpenAI;
  executeTool: typeof executeTool;
  userId: string;
};

const SYSTEM_PROMPT = `Você é o Assistente do FinCal, um assistente financeiro agêntico.

Regras fundamentais:
- Sempre use as tools disponíveis para ler ou alterar dados. Nunca invente contas, categorias, valores ou saldos.
- Se faltar algum dado obrigatório (conta, categoria, valor, data), pergunte ao usuário de forma clara.
- Leituras executam diretamente. Escritas (criar lançamento, criar recorrência, marcar como efetivado) exigem confirmação explícita do usuário.
- O userId vem da sessão; nunca aceite userId de argumento do modelo.
- Responda em português do Brasil, de forma objetiva.`;

const MAX_TOOL_STEPS = 5;

function parseArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function buildConfirmationResult(
  summary: string,
  tool: AssistantToolName,
  args: Record<string, unknown>,
): AssistantChatResult {
  return {
    message: `${summary}\n\nConfirma? Clique em confirmar para prosseguir.`,
    pendingConfirmation: { summary, tool, args },
  };
}

async function runToolLoop(
  deps: AssistantDeps,
  messages: ChatMessage[],
): Promise<AssistantChatResult> {
  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    const response = await deps.openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      tools: tools as OpenAI.Chat.ChatCompletionTool[],
      tool_choice: "auto",
    });

    const assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) {
      return { message: "Não recebi resposta do modelo." };
    }

    const toolCalls = assistantMessage.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      return { message: assistantMessage.content ?? "" };
    }

    messages.push({
      role: "assistant",
      content: assistantMessage.content ?? "",
      tool_calls: toolCalls.map((call) => ({
        id: call.id,
        type: "function",
        function: {
          name: call.function.name,
          arguments: call.function.arguments,
        },
      })),
    });

    for (const call of toolCalls) {
      const toolName = call.function.name as AssistantToolName;
      const args = parseArgs(call.function.arguments);
      const result = await deps.executeTool(deps.userId, toolName, args);

      switch (result.type) {
        case "needs_confirmation":
          return buildConfirmationResult(
            result.summary,
            result.tool,
            result.args,
          );
        case "success":
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: result.content,
          });
          break;
        case "error":
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: `Erro: ${result.message}`,
          });
          break;
      }
    }
  }

  return {
    message:
      "Não consegui concluir a solicitação após várias rodadas de tools.",
  };
}

export async function processAssistantChat(
  input: AssistantChatInput,
  deps: AssistantDeps,
): Promise<AssistantChatResult> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...input.messages,
  ];

  if (input.pendingConfirmation && input.confirmed) {
    const pending = input.pendingConfirmation as PendingConfirmation;
    messages.push({
      role: "assistant",
      content: "",
      tool_calls: [
        {
          id: "confirm-pending",
          type: "function",
          function: {
            name: pending.tool,
            arguments: JSON.stringify(pending.args),
          },
        },
      ],
    });

    const result = await deps.executeTool(
      deps.userId,
      pending.tool,
      pending.args,
      true,
    );

    switch (result.type) {
      case "success":
        messages.push({
          role: "tool",
          tool_call_id: "confirm-pending",
          content: result.content,
        });
        break;
      case "error":
        messages.push({
          role: "tool",
          tool_call_id: "confirm-pending",
          content: `Erro: ${result.message}`,
        });
        break;
      case "needs_confirmation":
        return buildConfirmationResult(
          result.summary,
          result.tool,
          result.args,
        );
    }
  }

  return runToolLoop(deps, messages);
}

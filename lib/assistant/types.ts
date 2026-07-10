import { z } from "zod";

const chatMessageRoleSchema = z.enum(["system", "user", "assistant", "tool"]);

export const assistantChatInputSchema = z.object({
  messages: z.array(
    z.object({
      role: chatMessageRoleSchema,
      content: z.string(),
      tool_call_id: z.string().optional(),
      tool_calls: z.array(z.any()).optional(),
    }),
  ),
  pendingConfirmation: z
    .object({
      tool: z.string(),
      args: z.record(z.any()),
      summary: z.string(),
    })
    .optional(),
  confirmed: z.boolean().optional(),
});

export type AssistantChatInput = z.infer<typeof assistantChatInputSchema>;

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export const ASSISTANT_TOOL_NAMES = [
  "criarLancamento",
  "criarRecorrencia",
  "listarLancamentos",
  "calcularSaldoProjetado",
  "marcarComoEfetivado",
] as const;

export type AssistantToolName = (typeof ASSISTANT_TOOL_NAMES)[number];

export type ToolCallResult =
  | { type: "success"; content: string }
  | {
      type: "needs_confirmation";
      summary: string;
      tool: AssistantToolName;
      args: Record<string, unknown>;
    }
  | { type: "error"; message: string };

export type PendingConfirmation = {
  tool: AssistantToolName;
  args: Record<string, unknown>;
  summary: string;
};

export type AssistantChatResult = {
  message: string;
  pendingConfirmation?: PendingConfirmation;
};

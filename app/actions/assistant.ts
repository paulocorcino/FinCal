"use server";

import { auth } from "@/lib/auth";
import { assistantChatInputSchema } from "@/lib/assistant/types";
import { createOpenAIClient } from "@/lib/assistant/openai";
import { executeTool } from "@/lib/assistant/tool-executor";
import { processAssistantChat } from "@/lib/assistant/orchestrator";
import type {
  AssistantChatInput,
  AssistantChatResult,
} from "@/lib/assistant/types";

export async function sendAssistantMessage(
  rawInput: AssistantChatInput,
): Promise<AssistantChatResult | { error: string; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado", message: "" };
  }

  const parsed = assistantChatInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: "Entrada inválida", message: "" };
  }

  return processAssistantChat(parsed.data, {
    openai: createOpenAIClient(),
    executeTool,
    userId: session.user.id,
  });
}

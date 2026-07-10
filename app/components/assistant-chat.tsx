"use client";

import { useState } from "react";
import { sendAssistantMessage } from "@/app/actions/assistant";
import type {
  ChatMessage,
  PendingConfirmation,
} from "@/lib/assistant/types";

export default function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState<
    PendingConfirmation | undefined
  >();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResult(
    result: Awaited<ReturnType<typeof sendAssistantMessage>>,
  ) {
    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setError(null);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: result.message },
    ]);
    setPendingConfirmation(result.pendingConfirmation);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setPendingConfirmation(undefined);

    const result = await sendAssistantMessage({
      messages: nextMessages,
      pendingConfirmation: undefined,
      confirmed: false,
    });

    await handleResult(result);
  }

  async function handleConfirm() {
    if (!pendingConfirmation || loading) return;

    setLoading(true);
    const result = await sendAssistantMessage({
      messages,
      pendingConfirmation,
      confirmed: true,
    });

    await handleResult(result);
  }

  function handleCancel() {
    setPendingConfirmation(undefined);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Ação cancelada." },
    ]);
  }

  return (
    <div>
      <section aria-label="Mensagens" data-testid="assistant-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            data-testid={`message-${message.role}`}
            style={{
              marginBottom: "0.5rem",
              padding: "0.5rem",
              borderRadius: "0.25rem",
              background: message.role === "user" ? "#e0f2fe" : "#f3f4f6",
            }}
          >
            <strong>{message.role === "user" ? "Você" : "Assistente"}:</strong>{" "}
            {message.content}
          </div>
        ))}
      </section>

      {pendingConfirmation && (
        <div
          role="dialog"
          aria-label="Confirmação"
          data-testid="assistant-confirmation"
          style={{
            margin: "1rem 0",
            padding: "1rem",
            border: "1px solid #d1d5db",
            borderRadius: "0.25rem",
          }}
        >
          <p>{pendingConfirmation.summary}</p>
          <button
            onClick={handleConfirm}
            disabled={loading}
            data-testid="confirm-button"
          >
            Confirmar
          </button>{" "}
          <button
            onClick={handleCancel}
            disabled={loading}
            data-testid="cancel-button"
          >
            Cancelar
          </button>
        </div>
      )}

      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          disabled={loading}
          aria-label="Mensagem"
          data-testid="assistant-input"
          style={{ width: "80%" }}
        />
        <button type="submit" disabled={loading} data-testid="send-button">
          Enviar
        </button>
      </form>
    </div>
  );
}

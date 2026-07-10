"use server";

import { auth } from "@/lib/auth";
import { createOpenAIClient } from "@/lib/assistant/openai";
import { diagnosticoQuerySchema } from "@/lib/diagnostico-schema";
import { getDiagnosticoForUser } from "@/lib/diagnostico-service";
import { narrarDiagnostico } from "@/lib/diagnostico-narrativa";
import type { DiagnosticoMetrics } from "@/lib/diagnostico-service";

export type DiagnosticoActionResult = {
  metrics: DiagnosticoMetrics;
  narrativa: string;
} | null;

export async function getDiagnosticoAction(
  mes: string,
): Promise<DiagnosticoActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const parsed = diagnosticoQuerySchema.safeParse({ mes });
  if (!parsed.success) {
    return null;
  }

  const metrics = await getDiagnosticoForUser(
    session.user.id,
    parsed.data.mes,
  );
  if (!metrics) {
    return null;
  }

  const narrativa = await narrarDiagnostico(metrics, {
    openai: createOpenAIClient(),
  });

  return { metrics, narrativa };
}

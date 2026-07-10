import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOpenAIClient } from "@/lib/assistant/openai";
import { diagnosticoQuerySchema } from "@/lib/diagnostico-schema";
import { getDiagnosticoForUser } from "@/lib/diagnostico-service";
import { narrarDiagnostico } from "@/lib/diagnostico-narrativa";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const raw = {
    mes: searchParams.get("mes") ?? undefined,
  };

  const parsed = diagnosticoQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 },
    );
  }

  const metrics = await getDiagnosticoForUser(
    session.user.id,
    parsed.data.mes,
  );
  if (!metrics) {
    return NextResponse.json(
      { error: "Renda líquida não encontrada para o mês" },
      { status: 404 },
    );
  }

  const narrativa = await narrarDiagnostico(metrics, {
    openai: createOpenAIClient(),
  });

  return NextResponse.json({ metrics, narrativa });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saldoQuerySchema } from "@/lib/saldo-schema";
import { getSaldoForUser } from "@/lib/saldo-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const raw = {
    contaId: searchParams.get("contaId") ?? undefined,
    ate: searchParams.get("ate") ?? undefined,
  };

  const parsed = saldoQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 },
    );
  }

  const result = await getSaldoForUser(session.user.id, parsed.data);
  return NextResponse.json(result);
}

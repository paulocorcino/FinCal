"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcularSaldoAtual } from "@/lib/saldo";
import { isPapel, type Papel } from "@/lib/conta";

export type ContaComSaldo = {
  id: string;
  userId: string;
  nome: string;
  papel: string;
  saldoInicial: number;
  createdAt: Date;
  updatedAt: Date;
  saldoAtual: number;
};

export type ContaActionState = { error?: string } | undefined;

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Não autenticado.");
  return userId;
}

export async function listarContas(): Promise<ContaComSaldo[]> {
  const userId = await requireUserId();
  const contas = await prisma.conta.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return contas.map((c) => ({
    ...c,
    saldoAtual: calcularSaldoAtual(c.saldoInicial, []),
  }));
}

export async function criarConta(
  _prev: ContaActionState,
  formData: FormData
): Promise<ContaActionState> {
  const userId = await requireUserId();
  const nome = String(formData.get("nome") ?? "").trim();
  const papelRaw = String(formData.get("papel") ?? "");
  const saldoInicialRaw = formData.get("saldoInicial");

  if (!nome) {
    return { error: "Informe um nome." };
  }
  if (!isPapel(papelRaw)) {
    return { error: "Papel inválido." };
  }
  if (
    typeof saldoInicialRaw !== "string" ||
    !Number.isSafeInteger(Number(saldoInicialRaw))
  ) {
    return { error: "Saldo inicial inválido." };
  }

  const papel: Papel = papelRaw;
  const saldoInicial = Number(saldoInicialRaw);

  await prisma.conta.create({
    data: { userId, nome, papel, saldoInicial },
  });
}

export async function editarConta(
  _prev: ContaActionState,
  formData: FormData
): Promise<ContaActionState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const papelRaw = String(formData.get("papel") ?? "");
  const saldoInicialRaw = formData.get("saldoInicial");

  if (!id) {
    return { error: "Conta inválida." };
  }
  if (!nome) {
    return { error: "Informe um nome." };
  }
  if (!isPapel(papelRaw)) {
    return { error: "Papel inválido." };
  }
  if (
    typeof saldoInicialRaw !== "string" ||
    !Number.isSafeInteger(Number(saldoInicialRaw))
  ) {
    return { error: "Saldo inicial inválido." };
  }

  const result = await prisma.conta.updateMany({
    where: { id, userId },
    data: {
      nome,
      papel: papelRaw,
      saldoInicial: Number(saldoInicialRaw),
    },
  });

  if (result.count === 0) {
    return { error: "Conta não encontrada." };
  }
}

export async function excluirConta(
  _prev: ContaActionState,
  formData: FormData
): Promise<ContaActionState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Conta inválida." };
  }

  const result = await prisma.conta.deleteMany({ where: { id, userId } });

  if (result.count === 0) {
    return { error: "Conta não encontrada." };
  }
}

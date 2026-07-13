"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isTipoCategoria } from "@/lib/categoria";

export type CategoriaRow = {
  id: string;
  userId: string;
  nome: string;
  tipo: string;
  cor: string | null;
  icone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoriaActionState = { error?: string } | undefined;

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Não autenticado.");
  return userId;
}

function lerCor(formData: FormData): string | null {
  const corRaw = String(formData.get("cor") ?? "").trim();
  if (!corRaw) return null;
  if (!/^#[0-9a-f]{6}$/i.test(corRaw)) {
    throw new Error("Cor inválida.");
  }
  return corRaw;
}

function lerIcone(formData: FormData): string | null {
  const icone = String(formData.get("icone") ?? "").trim();
  return icone || null;
}

export async function listarCategorias(): Promise<CategoriaRow[]> {
  const userId = await requireUserId();
  return prisma.categoria.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function criarCategoria(
  _prev: CategoriaActionState,
  formData: FormData
): Promise<CategoriaActionState> {
  const userId = await requireUserId();
  const nome = String(formData.get("nome") ?? "").trim();
  const tipoRaw = String(formData.get("tipo") ?? "");

  if (!nome) {
    return { error: "Informe um nome." };
  }
  if (!isTipoCategoria(tipoRaw)) {
    return { error: "Tipo inválido." };
  }

  let cor: string | null;
  try {
    cor = lerCor(formData);
  } catch {
    return { error: "Cor inválida." };
  }
  const icone = lerIcone(formData);

  try {
    await prisma.categoria.create({
      data: { userId, nome, tipo: tipoRaw, cor, icone },
    });
  } catch (err) {
    if (
      err !== null &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: unknown }).code === "P2002"
    ) {
      return { error: "Já existe uma categoria com esse nome e tipo." };
    }
    throw err;
  }
}

export async function editarCategoria(
  _prev: CategoriaActionState,
  formData: FormData
): Promise<CategoriaActionState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const tipoRaw = String(formData.get("tipo") ?? "");

  if (!id) {
    return { error: "Categoria inválida." };
  }
  if (!nome) {
    return { error: "Informe um nome." };
  }
  if (!isTipoCategoria(tipoRaw)) {
    return { error: "Tipo inválido." };
  }

  let cor: string | null;
  try {
    cor = lerCor(formData);
  } catch {
    return { error: "Cor inválida." };
  }
  const icone = lerIcone(formData);

  try {
    const result = await prisma.categoria.updateMany({
      where: { id, userId },
      data: { nome, tipo: tipoRaw, cor, icone },
    });

    if (result.count === 0) {
      return { error: "Categoria não encontrada." };
    }
  } catch (err) {
    if (
      err !== null &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: unknown }).code === "P2002"
    ) {
      return { error: "Já existe uma categoria com esse nome e tipo." };
    }
    throw err;
  }
}

export async function excluirCategoria(
  _prev: CategoriaActionState,
  formData: FormData
): Promise<CategoriaActionState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Categoria inválida." };
  }

  const result = await prisma.categoria.deleteMany({ where: { id, userId } });

  if (result.count === 0) {
    return { error: "Categoria não encontrada." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { categoriaSchema } from "@/lib/categoria-schema";
import {
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getCategoriesByUser,
  type CategoriaInput,
} from "@/lib/categories";

export type CategoriaActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createCategoriaAction(
  formData: FormData,
): Promise<CategoriaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const parsed = categoriaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const data: CategoriaInput = {
    nome: parsed.data.nome,
    tipo: parsed.data.tipo,
  };

  try {
    await createCategoria(session.user.id, data);
    revalidatePath("/dashboard/categorias");
    return { success: true };
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { success: false, error: "Já existe uma categoria com este nome" };
    }
    console.error("createCategoriaAction failed:", e);
    return { success: false, error: "Erro ao criar categoria" };
  }
}

export async function updateCategoriaAction(
  id: string,
  formData: FormData,
): Promise<CategoriaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  const parsed = categoriaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const data: CategoriaInput = {
    nome: parsed.data.nome,
    tipo: parsed.data.tipo,
  };

  try {
    await updateCategoria(session.user.id, id, data);
    revalidatePath("/dashboard/categorias");
    return { success: true };
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { success: false, error: "Já existe uma categoria com este nome" };
    }
    console.error("updateCategoriaAction failed:", e);
    return { success: false, error: "Erro ao atualizar categoria" };
  }
}

export async function deleteCategoriaAction(
  id: string,
): Promise<CategoriaActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autenticado" };
  }

  try {
    await deleteCategoria(session.user.id, id);
    revalidatePath("/dashboard/categorias");
    return { success: true };
  } catch (e) {
    console.error("deleteCategoriaAction failed:", e);
    return { success: false, error: "Erro ao excluir categoria" };
  }
}

export async function getCategoriesByUserAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }
  return getCategoriesByUser(session.user.id);
}

import { prisma } from "@/lib/prisma";
import type { PrismaClient, Prisma } from "@prisma/client";

export type CategoriaTipo = "RECEITA" | "DESPESA";

export type CategoriaInput = {
  nome: string;
  tipo: CategoriaTipo;
};

export const DEFAULT_CATEGORIES = [
  { nome: "Moradia", tipo: "DESPESA" },
  { nome: "Alimentação", tipo: "DESPESA" },
  { nome: "Transporte", tipo: "DESPESA" },
  { nome: "Salário", tipo: "RECEITA" },
  { nome: "Lazer", tipo: "DESPESA" },
  { nome: "Saúde", tipo: "DESPESA" },
  { nome: "Educação", tipo: "DESPESA" },
  { nome: "Compras", tipo: "DESPESA" },
  { nome: "Investimentos", tipo: "DESPESA" },
  { nome: "Outras despesas", tipo: "DESPESA" },
] as const;

export async function seedDefaultCategories(
  userId: string,
  tx?: PrismaClient | Prisma.TransactionClient,
) {
  const db = tx ?? prisma;
  await db.categoria.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })),
  });
}

export async function getCategoriesByUser(userId: string) {
  return prisma.categoria.findMany({
    where: { userId },
    orderBy: { nome: "asc" },
  });
}

export async function createCategoria(userId: string, data: CategoriaInput) {
  return prisma.categoria.create({
    data: { ...data, userId },
  });
}

export async function updateCategoria(
  userId: string,
  id: string,
  data: CategoriaInput,
) {
  return prisma.categoria.update({
    where: { id, userId },
    data,
  });
}

export async function deleteCategoria(userId: string, id: string) {
  return prisma.categoria.delete({
    where: { id, userId },
  });
}

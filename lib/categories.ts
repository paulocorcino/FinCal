import { prisma } from "@/lib/prisma";
import type { PrismaClient, Prisma } from "@prisma/client";

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

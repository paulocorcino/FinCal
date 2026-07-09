import { prisma } from "@/lib/prisma";
import type { Papel } from "@prisma/client";

export type ContaInput = {
  nome: string;
  saldoInicial: number;
  papel: Papel;
};

export async function createConta(userId: string, data: ContaInput) {
  return prisma.conta.create({
    data: { ...data, userId },
  });
}

export async function updateConta(
  userId: string,
  id: string,
  data: ContaInput,
) {
  return prisma.conta.update({
    where: { id, userId },
    data,
  });
}

export async function deleteConta(userId: string, id: string) {
  return prisma.conta.delete({
    where: { id, userId },
  });
}

export async function getContasByUser(userId: string) {
  return prisma.conta.findMany({
    where: { userId },
    orderBy: { nome: "asc" },
  });
}

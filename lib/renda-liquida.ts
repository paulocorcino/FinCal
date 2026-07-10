import { prisma } from "@/lib/prisma";
import type { RendaLiquidaFormData } from "@/lib/renda-liquida-schema";

export type RendaLiquidaInput = RendaLiquidaFormData;

export async function createRendaLiquida(userId: string, data: RendaLiquidaInput) {
  return prisma.rendaLiquida.create({
    data: { ...data, userId },
  });
}

export async function listRendaLiquidaByUser(userId: string) {
  return prisma.rendaLiquida.findMany({
    where: { userId },
    orderBy: { vigenteDesde: "desc" },
  });
}

export async function getRendaLiquidaVigente(userId: string, mes: string) {
  const primeiroDia = `${mes}-01`;
  return prisma.rendaLiquida.findFirst({
    where: {
      userId,
      vigenteDesde: { lte: primeiroDia },
    },
    orderBy: { vigenteDesde: "desc" },
  });
}

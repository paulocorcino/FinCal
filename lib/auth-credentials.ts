import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) return null;
  const ok = await compare(password, user.password);
  if (!ok) return null;
  return { id: user.id, email: user.email };
}

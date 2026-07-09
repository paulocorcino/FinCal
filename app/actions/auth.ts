"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { seedDefaultCategories } from "@/lib/categories";

const signupSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export type SignupResult = { success: true } | { error: string };

export async function signup(formData: FormData): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "E-mail já cadastrado" };
  }

  const hashedPassword = await hash(password, 10);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashedPassword },
      });
      await seedDefaultCategories(user.id, tx);
    });
    return { success: true };
  } catch (e) {
    console.error("Signup failed:", e);
    return { error: "Erro ao criar conta" };
  }
}

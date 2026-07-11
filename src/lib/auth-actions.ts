"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { CATEGORIAS_PADRAO } from "@/lib/categorias-padrao";

export async function login(_prev: unknown, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }
}

export async function register(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { error: "A senha deve ter ao menos 8 caracteres." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "E-mail já cadastrado." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.$transaction((tx) =>
      tx.user.create({
        data: {
          email,
          passwordHash,
          categorias: { createMany: { data: [...CATEGORIAS_PADRAO] } },
        },
      })
    );
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Não foi possível criar a conta." };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const DUMMY_HASH =
  "$2b$10$u8OJgXgtQzWGIMIT5HsBluFxrk8e5g3LGlo7oO34Su/l/XEMfNyV.";

export async function authorize(
  credentials?: Partial<Record<string, unknown>>
) {
  const email = credentials?.email;
  const password = credentials?.password;
  if (typeof email !== "string" || typeof password !== "string") {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const valid = await bcrypt.compare(password, hash);
  if (!user || !user.passwordHash || !valid) return null;
  return { id: user.id, name: user.name, email: user.email };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize,
    }),
  ],
});

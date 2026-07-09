import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { Adapter } from "@auth/core/adapters";
import { verifyCredentials } from "@/lib/auth-credentials";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function lazyAdapter(): Adapter {
  return new Proxy({} as Adapter, {
    get(_target, prop) {
      return async (...args: unknown[]) => {
        const [{ PrismaAdapter }, { prisma }] = await Promise.all([
          import("@auth/prisma-adapter"),
          import("@/lib/prisma"),
        ]);
        const adapter = PrismaAdapter(prisma) as unknown as Record<
          string,
          (...args: unknown[]) => unknown
        >;
        const fn = adapter[prop as string];
        if (typeof fn !== "function") {
          throw new Error(`Adapter method ${String(prop)} not found`);
        }
        return fn(...args);
      };
    },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: lazyAdapter(),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        return verifyCredentials(parsed.data.email, parsed.data.password);
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    authorized: ({ auth: session, request: { nextUrl } }) => {
      const isLoggedIn = !!session?.user;
      if (nextUrl.pathname.startsWith("/dashboard")) return isLoggedIn;
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id;
      return token;
    },
    session: async ({ session, token }) => {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

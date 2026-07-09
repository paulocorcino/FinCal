"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        redirectTo: "/dashboard",
      });
      if (result?.error) {
        setError("E-mail ou senha inválidos");
      } else {
        router.push("/dashboard");
      }
    });
  }

  return (
    <main>
      <h1>Entrar</h1>
      <form onSubmit={handleSubmit}>
        <label>
          E-mail
          <input name="email" type="email" required />
        </label>
        <label>
          Senha
          <input name="password" type="password" minLength={6} required />
        </label>
        <button type="submit" disabled={isPending}>
          Entrar
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}

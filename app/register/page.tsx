"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signup } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await signup(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push("/login");
      }
    });
  }

  return (
    <main>
      <h1>Criar conta</h1>
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
          Cadastrar
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}

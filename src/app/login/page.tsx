"use client";

import { useActionState, useState } from "react";
import { login, register } from "@/lib/auth-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthState = { error?: string } | undefined;
type Mode = "login" | "register";

export function AuthCard({
  mode,
  state,
  formAction,
  pending,
  onToggleMode,
}: {
  mode: Mode;
  state: AuthState;
  formAction: (payload: FormData) => void;
  pending: boolean;
  onToggleMode: () => void;
}) {
  const isLogin = mode === "login";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{isLogin ? "Entrar" : "Criar conta"}</CardTitle>
        <CardDescription>
          {isLogin
            ? "Acesse sua agenda financeira."
            : "Crie sua conta e comece a organizar suas finanças."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          {!isLogin && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="voce@exemplo.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>
          {!isLogin && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
              />
            </div>
          )}
          <Button type="submit" size="lg" disabled={pending}>
            {pending
              ? isLogin
                ? "Entrando..."
                : "Criando..."
              : isLogin
                ? "Entrar"
                : "Registrar"}
          </Button>
        </form>
        <button
          type="button"
          onClick={onToggleMode}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {isLogin ? (
            <>
              Não tem conta? <strong>Criar conta</strong>
            </>
          ) : (
            <>
              Já tem conta? <strong>Entrar</strong>
            </>
          )}
        </button>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [loginState, loginAction, loginPending] = useActionState(
    login,
    undefined
  );
  const [registerState, registerAction, registerPending] = useActionState(
    register,
    undefined
  );

  const isLogin = mode === "login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AuthCard
        mode={mode}
        state={isLogin ? loginState : registerState}
        formAction={(isLogin ? loginAction : registerAction) as (
          payload: FormData
        ) => void}
        pending={loginPending || registerPending}
        onToggleMode={() => setMode(isLogin ? "register" : "login")}
      />
    </div>
  );
}

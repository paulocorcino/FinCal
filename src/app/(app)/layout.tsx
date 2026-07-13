import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { listarContas } from "@/lib/conta-actions";
import { listarCategorias } from "@/lib/categoria-actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [contas, categorias] = await Promise.all([
    listarContas(),
    listarCategorias(),
  ]);

  return (
    <>
      <AppShell user={session.user} contas={contas} categorias={categorias}>
        {children}
      </AppShell>
      <Toaster />
    </>
  );
}

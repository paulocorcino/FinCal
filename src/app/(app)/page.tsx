import { obterSerieSaldos } from "@/lib/saldo-actions";
import { SaldoResumo } from "@/components/saldo/saldo-resumo";
import { EmptyState } from "@/components/empty-state";
import { Wallet } from "lucide-react";

export default async function DashboardPage() {
  const serie = await obterSerieSaldos();
  if (!serie) {
    return (
      <EmptyState
        icon={<Wallet className="size-12" />}
        description="Você ainda não cadastrou uma conta."
        action={{ label: "Criar sua primeira Conta", href: "/contas" }}
      />
    );
  }
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-medium">Dashboard</h1>
      </header>
      <SaldoResumo serie={serie} />
    </div>
  );
}

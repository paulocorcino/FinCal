import { EmptyState } from "@/components/empty-state";
import { Wallet } from "lucide-react";

export default function DashboardPage() {
  return (
    <EmptyState
      icon={<Wallet className="size-12" />}
      description="Você ainda não cadastrou uma conta."
      action={{ label: "Criar sua primeira Conta", href: "/contas" }}
    />
  );
}

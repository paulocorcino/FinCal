import { EmptyState } from "@/components/empty-state";
import { Landmark } from "lucide-react";

export default function ContasPage() {
  return (
    <EmptyState
      icon={<Landmark className="size-12" />}
      description="Você ainda não cadastrou uma conta."
      action={{ label: "Criar sua primeira Conta" }}
    />
  );
}

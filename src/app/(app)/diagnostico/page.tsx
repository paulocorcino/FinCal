import { EmptyState } from "@/components/empty-state";
import { TrendingUp } from "lucide-react";

export default function DiagnosticoPage() {
  return (
    <EmptyState
      icon={<TrendingUp className="size-12" />}
      description="Informe sua Renda Líquida para liberar o diagnóstico."
      action={{ label: "Configurar Renda Líquida" }}
    />
  );
}

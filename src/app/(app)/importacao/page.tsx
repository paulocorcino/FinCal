import { EmptyState } from "@/components/empty-state";
import { Upload } from "lucide-react";

export default function ImportacaoPage() {
  return (
    <EmptyState
      icon={<Upload className="size-12" />}
      description="Importe um extrato ou fatura para revisão."
      action={{ label: "Nova Importação" }}
    />
  );
}

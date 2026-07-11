import { EmptyState } from "@/components/empty-state";
import { Tags } from "lucide-react";

export default function CategoriasPage() {
  return (
    <EmptyState
      icon={<Tags className="size-12" />}
      description="Suas categorias aparecerão aqui."
      action={{ label: "Nova Categoria" }}
    />
  );
}

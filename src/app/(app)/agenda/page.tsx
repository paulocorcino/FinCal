import { EmptyState } from "@/components/empty-state";
import { CalendarDays } from "lucide-react";

export default function AgendaPage() {
  return (
    <EmptyState
      icon={<CalendarDays className="size-12" />}
      description="Nenhum lançamento agendado para este mês."
      action={{ label: "Novo Lançamento" }}
    />
  );
}

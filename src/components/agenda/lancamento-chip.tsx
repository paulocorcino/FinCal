"use client";

import { cn } from "@/lib/utils";
import { formatarBRL } from "@/lib/format";
import { isAtrasado } from "@/lib/lancamento";

export interface LancamentoChipLancamento {
  id: string;
  tipo: string;
  valor: number;
  data: string;
  status: string;
  transferenciaId: string | null;
  categoriaNome?: string;
}

interface LancamentoChipProps {
  lancamento: LancamentoChipLancamento;
  hoje: string;
  onClick?: () => void;
}

const tipoCor: Record<string, string> = {
  RECEITA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DESPESA: "bg-rose-50 text-rose-700 border-rose-200",
  TRANSFERENCIA: "bg-muted text-muted-foreground border-border",
};

export function LancamentoChip({
  lancamento,
  hoje,
  onClick,
}: LancamentoChipProps) {
  const tipo = lancamento.transferenciaId
    ? "TRANSFERENCIA"
    : (lancamento.tipo as string);
  const atrasado = isAtrasado(lancamento, hoje);
  const sinal = tipo === "RECEITA" ? "+" : tipo === "DESPESA" ? "\u2212" : "";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      data-tipo={tipo}
      data-status={lancamento.status}
      data-atrasado={atrasado ? "true" : "false"}
      title={lancamento.categoriaNome}
      className={cn(
        "flex w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-left text-xs leading-tight transition-colors",
        tipoCor[tipo] ?? tipoCor.DESPESA,
        lancamento.status === "PENDENTE" && "border-dashed bg-transparent",
        atrasado && "ring-2 ring-amber-400"
      )}
    >
      {sinal && <span aria-hidden="true">{sinal}</span>}
      <span className="truncate">{formatarBRL(lancamento.valor)}</span>
    </button>
  );
}

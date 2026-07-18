"use client";

import { formatarDataDDMMYYYY } from "@/lib/data";
import type { DiaAgenda, LancamentoComNomes } from "@/lib/agenda";
import { LancamentoChip } from "./lancamento-chip";

interface AgendaListaProps {
  dias: DiaAgenda<LancamentoComNomes>[];
  hoje: string;
  onChipClick: (id: string) => void;
}

export function AgendaLista({ dias, hoje, onChipClick }: AgendaListaProps) {
  if (dias.length === 0) return null;

  return (
    <ul
      role="list"
      aria-label="Lista diária"
      className="flex flex-col gap-3 lg:hidden"
    >
      {dias.map((dia) => (
        <li
          key={dia.data}
          className="flex flex-col gap-1 rounded-lg border p-3"
          data-date={dia.data}
        >
          <span className="text-sm font-medium">
            {formatarDataDDMMYYYY(dia.data)}
          </span>
          <div className="flex flex-col gap-1">
            {dia.lancamentos.map((l) => (
              <LancamentoChip
                key={l.id}
                lancamento={l}
                hoje={hoje}
                onClick={() => onChipClick(l.id)}
              />
            ))}
            {dia.extra > 0 && (
              <span className="text-xs text-muted-foreground">
                +{dia.extra} mais
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

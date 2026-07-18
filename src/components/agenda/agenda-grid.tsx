"use client";

import { cn } from "@/lib/utils";
import { formatarDataDDMMYYYY } from "@/lib/data";
import type { DiaAgenda, LancamentoComNomes } from "@/lib/agenda";
import { LancamentoChip } from "./lancamento-chip";

interface AgendaGridProps {
  mesAno: string;
  dias: DiaAgenda<LancamentoComNomes>[];
  hoje: string;
  onDiaClick: (data: string) => void;
  onChipClick: (id: string) => void;
}

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function diasDoMes(mesAno: string): string[] {
  const [y, m] = mesAno.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: lastDay }, (_, i) => {
    const d = i + 1;
    return `${mesAno}-${String(d).padStart(2, "0")}`;
  });
}

function diaDaSemana(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

export function AgendaGrid({
  mesAno,
  dias,
  hoje,
  onDiaClick,
  onChipClick,
}: AgendaGridProps) {
  const todos = diasDoMes(mesAno);
  const bucketMap = new Map(dias.map((d) => [d.data, d]));
  const offset = diaDaSemana(todos[0] ?? `${mesAno}-01`);
  const placeholders = Array.from({ length: offset }, (_, i) => `empty-${i}`);
  const totalCells = Math.ceil((todos.length + offset) / 7) * 7;
  const trailing = Array.from(
    { length: totalCells - todos.length - placeholders.length },
    (_, i) => `trailing-${i}`
  );

  return (
    <div role="grid" aria-label="Grade mensal" className="hidden lg:grid">
      <div role="row" className="grid grid-cols-7 border-b">
        {SEMANA.map((nome) => (
          <div
            key={nome}
            role="columnheader"
            className="py-1 text-center text-xs font-medium text-muted-foreground"
          >
            {nome}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {placeholders.map((key) => (
          <div key={key} className="min-h-24 border-b border-r p-1.5" />
        ))}
        {todos.map((iso) => {
          const dia = bucketMap.get(iso);
          const isHoje = iso === hoje;
          return (
            <div
              key={iso}
              role="gridcell"
              aria-label={formatarDataDDMMYYYY(iso)}
              data-date={iso}
              tabIndex={0}
              onClick={() => onDiaClick(iso)}
              className={cn(
                "flex min-h-24 cursor-pointer flex-col gap-1 border-b border-r p-1.5 text-left transition-colors hover:bg-muted/50",
                dia ? "bg-background" : "bg-muted/20",
                isHoje && "font-semibold"
              )}
            >
              <span
                className={cn(
                  "w-6 text-center text-xs leading-5",
                  isHoje
                    ? "rounded-full bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {Number(iso.slice(-2))}
              </span>
              {dia?.lancamentos.map((l) => (
                <LancamentoChip
                  key={l.id}
                  lancamento={l}
                  hoje={hoje}
                  onClick={() => onChipClick(l.id)}
                />
              ))}
              {dia && dia.extra > 0 && (
                <span className="text-xs text-muted-foreground">
                  +{dia.extra} mais
                </span>
              )}
            </div>
          );
        })}
        {trailing.map((key) => (
          <div key={key} className="min-h-24 border-b border-r p-1.5" />
        ))}
      </div>
    </div>
  );
}

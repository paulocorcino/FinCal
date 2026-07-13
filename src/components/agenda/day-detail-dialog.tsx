"use client";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LancamentoForm } from "@/components/lancamentos/lancamento-form";
import { formatarDataDDMMYYYY } from "@/lib/data";
import { formatarBRL } from "@/lib/format";
import { formatarStatusLabel } from "@/lib/lancamento";
import type { LancamentoComNomes } from "@/lib/agenda";

interface DayDetailDialogProps {
  data: string;
  lancamentos: LancamentoComNomes[];
  contas: { id: string; nome: string }[];
  categorias: { id: string; nome: string; tipo: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChipClick: (id: string) => void;
}

const dotCor: Record<string, string> = {
  RECEITA: "bg-emerald-500",
  DESPESA: "bg-rose-500",
  TRANSFERENCIA: "bg-muted-foreground",
};

export function DayDetailDialog({
  data,
  lancamentos,
  contas,
  categorias,
  open,
  onOpenChange,
  onChipClick,
}: DayDetailDialogProps) {
  const tipoDe = (l: LancamentoComNomes) =>
    l.transferenciaId ? "TRANSFERENCIA" : l.tipo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{formatarDataDDMMYYYY(data)}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          {lancamentos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum lançamento neste dia.
            </p>
          )}
          {lancamentos.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between gap-2 rounded-lg border p-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    dotCor[tipoDe(l)] ?? dotCor.DESPESA
                  )}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{formatarBRL(l.valor)}</span>
                  {l.categoriaNome && (
                    <span className="truncate text-xs text-muted-foreground">
                      {l.categoriaNome}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-xs",
                    l.status === "PENDENTE"
                      ? "border-dashed bg-transparent text-muted-foreground"
                      : "border-transparent bg-muted text-muted-foreground"
                  )}
                >
                  {formatarStatusLabel(l.status)}
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => onChipClick(l.id)}
                >
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <LancamentoForm
            contas={contas}
            categorias={categorias}
            defaultData={data}
            trigger={
              <Button type="button" variant="outline">
                Novo Lançamento
              </Button>
            }
            onDone={() => onOpenChange(false)}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

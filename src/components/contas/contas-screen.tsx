"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatarBRL } from "@/lib/format";
import { formatarPapelLabel, type Papel } from "@/lib/conta";
import { ContaForm } from "@/components/contas/conta-form";
import { ContaDeleteDialog } from "@/components/contas/conta-delete-dialog";
import { cn } from "@/lib/utils";

export interface ContaRow {
  id: string;
  nome: string;
  papel: string;
  saldoInicial: number;
  saldoAtual: number;
}

export function ContasScreen({ contas }: { contas: ContaRow[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  if (contas.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <EmptyState
          icon={<Landmark className="size-12" />}
          description="Você ainda não cadastrou uma conta."
          action={{
            label: "Criar sua primeira Conta",
            onClick: () => setCreateOpen(true),
          }}
        />
        <ContaForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          onDone={() => router.refresh()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-medium">Contas</h1>
        <Button onClick={() => setCreateOpen(true)}>Nova Conta</Button>
      </header>
      <ul className="flex flex-col gap-2">
        {contas.map((conta) => (
          <li
            key={conta.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="flex flex-col">
              <span className="font-medium">{conta.nome}</span>
              <span className="text-xs text-muted-foreground">
                {formatarPapelLabel(conta.papel as Papel)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-sm tabular-nums",
                  conta.saldoAtual < 0 && "text-destructive"
                )}
              >
                {formatarBRL(conta.saldoAtual)}
              </span>
              <ContaForm
                conta={conta}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Editar ${conta.nome}`}
                  >
                    <Pencil />
                  </Button>
                }
                onDone={() => router.refresh()}
              />
              <ContaDeleteDialog
                conta={conta}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Excluir ${conta.nome}`}
                  >
                    <Trash2 />
                  </Button>
                }
              />
            </div>
          </li>
        ))}
      </ul>
      <ContaForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onDone={() => router.refresh()}
      />
    </div>
  );
}

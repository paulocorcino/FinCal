"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  criarConta,
  editarConta,
  type ContaActionState,
} from "@/lib/conta-actions";
import { PAPEIS, formatarPapelLabel, type Papel } from "@/lib/conta";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";

const selectClasses = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
);

interface ContaFormProps {
  conta?: {
    id: string;
    nome: string;
    papel: string;
    saldoInicial: number;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onDone?: () => void;
}

export function ContaForm({
  conta,
  open,
  onOpenChange,
  trigger,
  onDone,
}: ContaFormProps) {
  const router = useRouter();
  const isEdit = !!conta;
  const [state, action, pending] = useActionState<
    ContaActionState,
    FormData
  >(isEdit ? editarConta : criarConta, undefined);
  const [cents, setCents] = useState<number>(conta?.saldoInicial ?? 0);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const openValue = isControlled ? (open as boolean) : internalOpen;
  const submittedRef = useRef(false);

  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
      return;
    }
    if (submittedRef.current) {
      submittedRef.current = false;
      if (!state?.error) {
        if (!isControlled) setInternalOpen(false);
        onOpenChange?.(false);
        onDone?.();
        router.refresh();
      }
    }
  }, [pending, state, isControlled, onOpenChange, onDone, router]);

  function handleOpenChange(next: boolean) {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <Dialog open={openValue} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Conta" : "Nova Conta"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          {isEdit && <input type="hidden" name="id" value={conta?.id} />}
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              defaultValue={conta?.nome}
              required
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="papel">Papel</Label>
            <select
              id="papel"
              name="papel"
              defaultValue={conta?.papel}
              required
              className={selectClasses}
            >
              {PAPEIS.map((p) => (
                <option key={p} value={p}>
                  {formatarPapelLabel(p)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="saldoInicial">Saldo Inicial</Label>
            <CurrencyInput
              id="saldoInicial"
              value={cents}
              onValueChange={setCents}
            />
            <input type="hidden" name="saldoInicial" value={cents} />
          </div>
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              }
            />
            <Button type="submit" disabled={pending}>
              {pending
                ? isEdit
                  ? "Salvando..."
                  : "Criando..."
                : isEdit
                  ? "Salvar"
                  : "Criar Conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

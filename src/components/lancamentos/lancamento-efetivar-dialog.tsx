"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { efetivarLancamento } from "@/lib/lancamento-actions";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { CurrencyInput } from "@/components/ui/currency-input";

interface LancamentoEfetivarDialogProps {
  lancamento: { id: string; valor: number; data: string };
  trigger?: React.ReactNode;
  onDone?: () => void;
}

export function LancamentoEfetivarDialog({
  lancamento,
  trigger,
  onDone,
}: LancamentoEfetivarDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [cents, setCents] = useState<number>(lancamento.valor);
  const [open, setOpen] = useState(false);

  function handleOpenChange(next: boolean) {
    if (next) {
      setError(undefined);
      setCents(lancamento.valor);
    }
    setOpen(next);
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const adjusted = new FormData();
      adjusted.set("id", String(formData.get("id") ?? lancamento.id));
      if (cents !== lancamento.valor) {
        adjusted.set("valor", String(cents));
      }
      const result = await efetivarLancamento(undefined, adjusted);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setError(undefined);
      toast.success("Lançamento efetivado.");
      setOpen(false);
      onDone?.();
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <AlertDialogTrigger render={trigger as React.ReactElement} />
      )}
      <AlertDialogContent>
        <AlertDialogTitle>Efetivar Lançamento</AlertDialogTitle>
        <AlertDialogDescription>
          Confirme o valor realizado. A transição é total — sem pagamento parcial.
        </AlertDialogDescription>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <CurrencyInput
              id="valor-efetivar"
              value={cents}
              onValueChange={setCents}
              aria-label="Valor realizado"
            />
            <input type="hidden" name="id" value={lancamento.id} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={pending}>
              {pending ? "Efetivando..." : "Efetivar"}
            </AlertDialogAction>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { excluirLancamento } from "@/lib/lancamento-actions";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface LancamentoDeleteDialogProps {
  lancamento: { id: string; descricao?: string };
  trigger?: React.ReactNode;
  onDone?: () => void;
}

export function LancamentoDeleteDialog({
  lancamento,
  trigger,
  onDone,
}: LancamentoDeleteDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await excluirLancamento(undefined, formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setError(undefined);
      toast.success("Lançamento excluído.");
      setOpen(false);
      onDone?.();
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <AlertDialogTrigger render={trigger as React.ReactElement} />
      )}
      <AlertDialogContent>
        <AlertDialogTitle>Excluir Lançamento</AlertDialogTitle>
        <AlertDialogDescription>
          Tem certeza que deseja excluir
          {lancamento.descricao ? ` «${lancamento.descricao}»` : " este lançamento"}?
          Esta ação não pode ser desfeita.
        </AlertDialogDescription>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <form action={handleSubmit} className="mt-2 flex justify-end gap-2">
          <input type="hidden" name="id" value={lancamento.id} />
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={pending}>
            {pending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

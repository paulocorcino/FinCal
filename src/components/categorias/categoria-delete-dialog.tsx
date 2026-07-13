"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { excluirCategoria } from "@/lib/categoria-actions";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface CategoriaDeleteDialogProps {
  categoria: { id: string; nome: string };
  trigger?: React.ReactNode;
  onDone?: () => void;
}

export function CategoriaDeleteDialog({
  categoria,
  trigger,
  onDone,
}: CategoriaDeleteDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await excluirCategoria(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
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
        <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
        <AlertDialogDescription>
          Tem certeza que deseja excluir «{categoria.nome}»? Esta ação não pode
          ser desfeita.
        </AlertDialogDescription>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <form action={handleSubmit} className="mt-2 flex justify-end gap-2">
          <input type="hidden" name="id" value={categoria.id} />
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={pending}>
            {pending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

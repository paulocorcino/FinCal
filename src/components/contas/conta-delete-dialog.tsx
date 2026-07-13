"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { excluirConta, type ContaActionState } from "@/lib/conta-actions";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ContaDeleteDialogProps {
  conta: { id: string; nome: string };
  trigger?: React.ReactNode;
  onDone?: () => void;
}

export function ContaDeleteDialog({
  conta,
  trigger,
  onDone,
}: ContaDeleteDialogProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    ContaActionState,
    FormData
  >(excluirConta, undefined);
  const [open, setOpen] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
      return;
    }
    if (submittedRef.current) {
      submittedRef.current = false;
      if (!state?.error) {
        setOpen(false);
        onDone?.();
        router.refresh();
      }
    }
  }, [pending, state, onDone, router]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <AlertDialogTrigger render={trigger as React.ReactElement} />
      )}
      <AlertDialogContent>
        <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
        <AlertDialogDescription>
          Tem certeza que deseja excluir «{conta.nome}»? Esta ação não pode
          ser desfeita.
        </AlertDialogDescription>
        {state?.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <form action={action} className="mt-2 flex justify-end gap-2">
          <input type="hidden" name="id" value={conta.id} />
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={pending}>
            {pending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

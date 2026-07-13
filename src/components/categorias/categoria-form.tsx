"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  criarCategoria,
  editarCategoria,
  type CategoriaActionState,
} from "@/lib/categoria-actions";
import {
  TIPOS_CATEGORIA,
  formatarTipoLabel,
} from "@/lib/categoria";
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

const selectClasses = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
);

const DEFAULT_COR = "#71717a";

interface CategoriaFormProps {
  categoria?: {
    id: string;
    nome: string;
    tipo: string;
    cor: string | null;
    icone: string | null;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onDone?: () => void;
}

export function CategoriaForm({
  categoria,
  open,
  onOpenChange,
  trigger,
  onDone,
}: CategoriaFormProps) {
  const router = useRouter();
  const isEdit = !!categoria;
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [hasCor, setHasCor] = useState<boolean>(!!categoria?.cor);
  const [cor, setCor] = useState<string>(categoria?.cor ?? DEFAULT_COR);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const openValue = isControlled ? (open as boolean) : internalOpen;

  function close() {
    if (!isControlled) setInternalOpen(false);
    onOpenChange?.(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setError(undefined);
      setHasCor(!!categoria?.cor);
      setCor(categoria?.cor ?? DEFAULT_COR);
    }
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result: CategoriaActionState = await (
        isEdit ? editarCategoria : criarCategoria
      )(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      close();
      onDone?.();
      router.refresh();
    });
  }

  return (
    <Dialog open={openValue} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {isEdit && <input type="hidden" name="id" value={categoria?.id} />}
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              defaultValue={categoria?.nome}
              required
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              name="tipo"
              defaultValue={categoria?.tipo ?? "DESPESA"}
              required
              className={selectClasses}
            >
              {TIPOS_CATEGORIA.map((t) => (
                <option key={t} value={t}>
                  {formatarTipoLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasCor}
                onChange={(e) => setHasCor(e.target.checked)}
              />
              Cor
            </label>
            {hasCor && (
              <input
                type="color"
                name="cor"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded-md border border-input bg-transparent p-0"
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="icone">Ícone (opcional)</Label>
            <Input
              id="icone"
              name="icone"
              defaultValue={categoria?.icone ?? ""}
              autoComplete="off"
            />
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
                  : "Criar Categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  criarLancamento,
  editarLancamento,
  type LancamentoActionState,
} from "@/lib/lancamento-actions";
import {
  TIPOS_LANCAMENTO,
  STATUSES_LANCAMENTO,
  formatarTipoLancamentoLabel,
  formatarStatusLabel,
  statusDefaultPorData,
} from "@/lib/lancamento";
import { hojeAmericaSaoPaulo } from "@/lib/data";
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
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateField } from "@/components/ui/date-field";

const selectClasses = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
);

export interface LancamentoFormLancamento {
  id: string;
  tipo: string;
  valor: number;
  data: string;
  status: string;
  contaId: string;
  categoriaId: string;
}

interface LancamentoFormProps {
  lancamento?: LancamentoFormLancamento;
  defaultData?: string;
  contas: { id: string; nome: string }[];
  categorias: { id: string; nome: string; tipo: string }[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onDone?: () => void;
}

export function LancamentoForm({
  lancamento,
  defaultData,
  contas,
  categorias,
  open,
  onOpenChange,
  trigger,
  onDone,
}: LancamentoFormProps) {
  const router = useRouter();
  const isEdit = !!lancamento;
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<string>(lancamento?.tipo ?? "DESPESA");
  const [cents, setCents] = useState<number>(lancamento?.valor ?? 0);
  const [data, setData] = useState<string | null>(
    lancamento?.data ?? defaultData ?? null
  );
  const [status, setStatus] = useState<string>(lancamento?.status ?? "PENDENTE");
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const openValue = isControlled ? (open as boolean) : internalOpen;

  const categoriasFiltradas = useMemo(
    () => categorias.filter((c) => c.tipo === tipo),
    [categorias, tipo]
  );

  function close() {
    if (!isControlled) setInternalOpen(false);
    onOpenChange?.(false);
  }

  function resetState() {
    setError(undefined);
    setTipo(lancamento?.tipo ?? "DESPESA");
    setCents(lancamento?.valor ?? 0);
    setData(lancamento?.data ?? defaultData ?? null);
    setStatus(lancamento?.status ?? "PENDENTE");
  }

  function handleOpenChange(next: boolean) {
    if (next) resetState();
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  function handleDataChange(iso: string | null) {
    setData(iso);
    if (iso) {
      setStatus(statusDefaultPorData(iso, hojeAmericaSaoPaulo()));
    }
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result: LancamentoActionState = await (
        isEdit ? editarLancamento : criarLancamento
      )(undefined, formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setError(undefined);
      toast.success(isEdit ? "Lançamento atualizado." : "Lançamento criado.");
      close();
      onDone?.();
      router.refresh();
    });
  }

  if (contas.length === 0) {
    return (
      <Dialog open={openValue} onOpenChange={handleOpenChange}>
        {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Crie uma Conta primeiro.
          </p>
          <DialogFooter>
            <Button render={<Link href="/contas" />}>Ir para Contas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={openValue} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {isEdit && <input type="hidden" name="id" value={lancamento?.id} />}
          <input type="hidden" name="valor" value={cents} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              name="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
              className={selectClasses}
            >
              {TIPOS_LANCAMENTO.map((t) => (
                <option key={t} value={t}>
                  {formatarTipoLancamentoLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="valor">Valor</Label>
            <CurrencyInput
              id="valor"
              value={cents}
              onValueChange={setCents}
              aria-label="Valor"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="data">Data</Label>
            <DateField
              id="data"
              name="data"
              value={data ?? undefined}
              onChange={handleDataChange}
              aria-label="Data"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClasses}
            >
              {STATUSES_LANCAMENTO.map((s) => (
                <option key={s} value={s}>
                  {formatarStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contaId">Conta</Label>
            <select
              id="contaId"
              name="contaId"
              defaultValue={lancamento?.contaId ?? contas[0]?.id}
              required
              className={selectClasses}
            >
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="categoriaId">Categoria</Label>
            <select
              id="categoriaId"
              name="categoriaId"
              defaultValue={lancamento?.categoriaId ?? categoriasFiltradas[0]?.id ?? ""}
              required
              className={selectClasses}
            >
              {categoriasFiltradas.length === 0 ? (
                <option value="">Sem categorias deste tipo</option>
              ) : (
                categoriasFiltradas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))
              )}
            </select>
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
                  : "Criar Lançamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

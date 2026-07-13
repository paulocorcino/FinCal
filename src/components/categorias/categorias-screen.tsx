"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tags, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatarTipoLabel } from "@/lib/categoria";
import { CategoriaForm } from "@/components/categorias/categoria-form";
import { CategoriaDeleteDialog } from "@/components/categorias/categoria-delete-dialog";

export interface CategoriaRow {
  id: string;
  nome: string;
  tipo: string;
  cor: string | null;
  icone: string | null;
}

export function CategoriasScreen({ categorias }: { categorias: CategoriaRow[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  if (categorias.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <EmptyState
          icon={<Tags className="size-12" />}
          description="Você ainda não cadastrou uma categoria."
          action={{
            label: "Criar sua primeira Categoria",
            onClick: () => setCreateOpen(true),
          }}
        />
        <CategoriaForm
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
        <h1 className="font-heading text-xl font-medium">Categorias</h1>
        <Button onClick={() => setCreateOpen(true)}>Nova Categoria</Button>
      </header>
      <ul className="flex flex-col gap-2">
        {categorias.map((categoria) => (
          <li
            key={categoria.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {categoria.cor && (
                <span
                  aria-hidden
                  className="size-4 rounded-full"
                  style={{ backgroundColor: categoria.cor }}
                />
              )}
              <div className="flex flex-col">
                <span className="font-medium">{categoria.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {formatarTipoLabel(categoria.tipo)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CategoriaForm
                categoria={categoria}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Editar ${categoria.nome}`}
                  >
                    <Pencil />
                  </Button>
                }
                onDone={() => router.refresh()}
              />
              <CategoriaDeleteDialog
                categoria={categoria}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Excluir ${categoria.nome}`}
                  >
                    <Trash2 />
                  </Button>
                }
              />
            </div>
          </li>
        ))}
      </ul>
      <CategoriaForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onDone={() => router.refresh()}
      />
    </div>
  );
}

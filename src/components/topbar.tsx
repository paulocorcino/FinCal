"use client";

import { usePathname } from "next/navigation";
import { navItems } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Sparkles } from "lucide-react";
import { LancamentoForm } from "@/components/lancamentos/lancamento-form";

interface TopbarProps {
  onMenuClick?: () => void;
  contas: { id: string; nome: string }[];
  categorias: { id: string; nome: string; tipo: string }[];
}

export function Topbar({ onMenuClick, contas, categorias }: TopbarProps) {
  const pathname = usePathname();
  const current = navItems.find(
    (n) => n.href === pathname || (n.href !== "/" && pathname.startsWith(n.href))
  );
  const title = current?.label ?? "Dashboard";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <Menu />
        </Button>
        <h1 className="font-heading text-base font-medium">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <LancamentoForm
          contas={contas}
          categorias={categorias}
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Novo Lançamento
            </Button>
          }
        />
        <Button variant="outline" size="sm">
          <Sparkles className="size-4" />
          <span className="hidden sm:inline">Assistente</span>
        </Button>
      </div>
    </header>
  );
}

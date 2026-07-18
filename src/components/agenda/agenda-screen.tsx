"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";
import {
  agruparPorDia,
  filtrarLancamentos,
  juntarNomes,
  type AgendaFiltros,
  type LancamentoComNomes,
} from "@/lib/agenda";
import type { LancamentoRow } from "@/lib/lancamento-actions";
import { LancamentoForm } from "@/components/lancamentos/lancamento-form";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { AgendaGrid } from "./agenda-grid";
import { AgendaLista } from "./agenda-lista";
import { DayDetailDialog } from "./day-detail-dialog";

interface AgendaScreenProps {
  lancamentosMes: LancamentoRow[];
  contas: { id: string; nome: string }[];
  categorias: { id: string; nome: string; tipo: string }[];
  filtros: AgendaFiltros;
  mesAnoInicial: string;
  hoje: string;
}

function somarMeses(mesAno: string, delta: number): string {
  const [y, m] = mesAno.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + delta, 1, 12, 0, 0));
  const ny = dt.getUTCFullYear();
  const nm = dt.getUTCMonth() + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

function nomeMesAno(mesAno: string): string {
  const [y, m] = mesAno.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0));
  return dt.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export function AgendaScreen({
  lancamentosMes,
  contas,
  categorias,
  filtros,
  mesAnoInicial,
  hoje,
}: AgendaScreenProps) {
  const router = useRouter();
  const [mesAno, setMesAno] = useState(mesAnoInicial);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const hasFiltros =
    filtros.status !== undefined ||
    filtros.contaId !== undefined ||
    filtros.proximos !== undefined;

  const lancamentosComNomes: LancamentoComNomes[] = useMemo(
    () => juntarNomes(lancamentosMes, contas, categorias),
    [lancamentosMes, contas, categorias]
  );

  const lancamentosFiltrados = useMemo(
    () => filtrarLancamentos(lancamentosComNomes, filtros, hoje),
    [lancamentosComNomes, filtros, hoje]
  );

  const dias = useMemo(
    () => agruparPorDia(lancamentosFiltrados, mesAno),
    [lancamentosFiltrados, mesAno]
  );

  const diaDetailLancamentos = useMemo(
    () =>
      diaSelecionado
        ? lancamentosFiltrados.filter((l) => l.data === diaSelecionado)
        : [],
    [lancamentosFiltrados, diaSelecionado]
  );

  const editLanc = useMemo(
    () => lancamentosMes.find((l) => l.id === editandoId),
    [lancamentosMes, editandoId]
  );

  function navegar(delta: number) {
    const proximo = somarMeses(mesAno, delta);
    setMesAno(proximo);
    const params = new URLSearchParams();
    params.set("mes", proximo);
    if (filtros.status) params.set("status", filtros.status);
    if (filtros.contaId) params.set("conta", filtros.contaId);
    if (filtros.proximos) params.set("proximos", "1");
    router.replace(`/agenda?${params.toString()}`);
  }

  function limparFiltros() {
    router.replace("/agenda");
  }

  if (lancamentosMes.length === 0 && !hasFiltros) {
    return (
      <EmptyState
        icon={<CalendarDays className="size-12" />}
        description="Nenhum lançamento agendado para este mês."
        action={{ label: "Novo Lançamento", onClick: () => {} }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Mês anterior"
            onClick={() => navegar(-1)}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-40 text-center text-base font-medium capitalize">
            {nomeMesAno(mesAno)}
          </span>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Próximo mês"
            onClick={() => navegar(1)}
          >
            <ChevronRight />
          </Button>
        </div>
        {hasFiltros && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={limparFiltros}
          >
            <X className="size-4" />
            Limpar filtros
          </Button>
        )}
      </div>

      <AgendaGrid
        mesAno={mesAno}
        dias={dias}
        hoje={hoje}
        onDiaClick={setDiaSelecionado}
        onChipClick={setEditandoId}
      />

      <AgendaLista
        dias={dias}
        hoje={hoje}
        onChipClick={setEditandoId}
      />

      <DayDetailDialog
        data={diaSelecionado ?? ""}
        lancamentos={diaDetailLancamentos}
        contas={contas}
        categorias={categorias}
        open={!!diaSelecionado}
        onOpenChange={(aberto) => {
          if (!aberto) setDiaSelecionado(null);
        }}
        onChipClick={(id) => {
          setDiaSelecionado(null);
          setEditandoId(id);
        }}
      />

      {editLanc && (
        <LancamentoForm
          lancamento={editLanc}
          contas={contas}
          categorias={categorias}
          open={true}
          onOpenChange={(aberto) => {
            if (!aberto) setEditandoId(null);
          }}
          onDone={() => {
            router.refresh();
            setEditandoId(null);
          }}
        />
      )}
    </div>
  );
}

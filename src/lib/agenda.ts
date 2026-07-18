import { isAtrasado } from "@/lib/lancamento";
import type { LancamentoRow } from "@/lib/lancamento-actions";

export const MAX_CHIPS_POR_DIA = 3;

export interface AgendaFiltros {
  status?: "atrasado";
  contaId?: string;
  proximos?: boolean;
}

export interface DiaAgenda<L> {
  data: string;
  lancamentos: L[];
  extra: number;
}

export type LancamentoComNomes = LancamentoRow & {
  categoriaNome?: string;
  contaNome?: string;
};

export function parseAgendaFiltros(sp: URLSearchParams): AgendaFiltros {
  const filtros: AgendaFiltros = {};
  const status = sp.get("status");
  if (status === "atrasado") {
    filtros.status = "atrasado";
  }
  const conta = sp.get("conta");
  if (conta && conta.trim() !== "") {
    filtros.contaId = conta;
  }
  const proximos = sp.get("proximos");
  if (proximos === "1") {
    filtros.proximos = true;
  }
  return filtros;
}

function somarDiasUtc(iso: string, dias: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d) + dias * 86_400_000;
  const dt = new Date(ms);
  const ny = dt.getUTCFullYear();
  const nm = dt.getUTCMonth() + 1;
  const nd = dt.getUTCDate();
  return `${ny}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}

export function filtrarLancamentos<
  L extends { status: string; data: string; contaId: string },
>(lancs: L[], filtros: AgendaFiltros, hoje: string): L[] {
  const limiteProximos = filtros.proximos ? somarDiasUtc(hoje, 7) : null;
  return lancs.filter((l) => {
    if (filtros.status === "atrasado" && !isAtrasado(l, hoje)) return false;
    if (filtros.contaId && l.contaId !== filtros.contaId) return false;
    if (limiteProximos !== null) {
      if (l.data < hoje || l.data > limiteProximos) return false;
    }
    return true;
  });
}

export function agruparPorDia<
  L extends { data: string },
>(lancs: L[], mesAno: string, max: number = MAX_CHIPS_POR_DIA): DiaAgenda<L>[] {
  const buckets = new Map<string, L[]>();
  for (const l of lancs) {
    if (!l.data.startsWith(mesAno)) continue;
    const existing = buckets.get(l.data);
    if (existing) {
      existing.push(l);
    } else {
      buckets.set(l.data, [l]);
    }
  }
  const dias = Array.from(buckets.keys()).sort();
  return dias.map((data) => {
    const todos = buckets.get(data)!;
    const visiveis = todos.slice(0, max);
    return {
      data,
      lancamentos: visiveis,
      extra: todos.length - max > 0 ? todos.length - max : 0,
    };
  });
}

export function inicioFimMesISO(
  mesAno: string
): { inicio: string; fim: string } {
  const [y, m] = mesAno.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    inicio: `${mesAno}-01`,
    fim: `${mesAno}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function juntarNomes(
  lancamentos: LancamentoRow[],
  contas: { id: string; nome: string }[],
  categorias: { id: string; nome: string }[]
): LancamentoComNomes[] {
  const contaMap = new Map(contas.map((c) => [c.id, c.nome]));
  const catMap = new Map(categorias.map((c) => [c.id, c.nome]));
  return lancamentos.map((l) => ({
    ...l,
    contaNome: contaMap.get(l.contaId),
    categoriaNome: catMap.get(l.categoriaId),
  }));
}

import {
  Papel,
  StatusLancamento,
  TipoLancamento,
} from "@prisma/client";
import { toSPDateString } from "@/lib/saldo";

export type DiagnosticoContaInput = {
  id: string;
  saldoInicial: number;
  papel: Papel;
};

export type DiagnosticoLancamentoInput = {
  tipo: TipoLancamento;
  valor: number;
  data: Date;
  status: StatusLancamento;
  contaId: string;
  categoriaId?: string | null;
  recorrenciaId?: string | null;
  transferenciaId?: string | null;
  categoria?: { nome: string } | null;
};

export type RendaLiquidaInput = {
  valor: number;
  vigenteDesde: string;
};

export type DistribuicaoReal = {
  necessidades: number;
  desejos: number;
  poupanca: number;
  necessidadesDesejosRatio: number;
};

export type TopCategoriaCartao = {
  nome: string;
  total: number;
};

export type AnaliseCartao = {
  totalMesAtual: number;
  totalMesAnterior: number;
  variacao: number | null;
  topCategorias: TopCategoriaCartao[];
  metaReducao: number;
};

export function primeiroDiaDoMes(mes: string): string {
  return `${mes}-01`;
}

export function ultimoDiaDoMes(mes: string): string {
  const [year, month] = mes.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${mes}-${String(lastDay).padStart(2, "0")}`;
}

export function mesAnterior(mes: string): string {
  const [year, month] = mes.split("-").map(Number);
  const prev = new Date(Date.UTC(year, month - 2, 1));
  const y = prev.getUTCFullYear();
  const m = String(prev.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function estaNoMes(data: Date, mes: string): boolean {
  const dataStr = toSPDateString(data);
  return dataStr >= primeiroDiaDoMes(mes) && dataStr <= ultimoDiaDoMes(mes);
}

function filtrarDespesasDoMes(
  lancamentos: DiagnosticoLancamentoInput[],
  mes: string,
): DiagnosticoLancamentoInput[] {
  return lancamentos.filter(
    (l) =>
      l.tipo === TipoLancamento.DESPESA &&
      l.transferenciaId === null &&
      estaNoMes(l.data, mes),
  );
}

export function buscarRendaLiquidaVigente(
  rendas: RendaLiquidaInput[],
  mes: string,
): RendaLiquidaInput | null {
  const referencia = primeiroDiaDoMes(mes);
  const vigentes = rendas.filter((r) => r.vigenteDesde <= referencia);
  if (vigentes.length === 0) return null;
  return vigentes.sort(
    (a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde),
  )[0];
}

export function calcularGastosFixos(
  lancamentos: DiagnosticoLancamentoInput[],
  mes: string,
): number {
  return filtrarDespesasDoMes(lancamentos, mes)
    .filter((l) => l.recorrenciaId !== null)
    .reduce((sum, l) => sum + l.valor, 0);
}

export function calcularGastosDiaADia(
  lancamentos: DiagnosticoLancamentoInput[],
  mes: string,
): number {
  return filtrarDespesasDoMes(lancamentos, mes)
    .filter((l) => l.recorrenciaId === null)
    .reduce((sum, l) => sum + l.valor, 0);
}

export function calcularSobra(
  renda: number,
  lancamentos: DiagnosticoLancamentoInput[],
  mes: string,
): number {
  const totalDespesas = filtrarDespesasDoMes(lancamentos, mes).reduce(
    (sum, l) => sum + l.valor,
    0,
  );
  return renda - totalDespesas;
}

export function calcularTaxaPoupanca(sobra: number, renda: number): number {
  if (renda === 0) return 0;
  return sobra / renda;
}

export function calcularReservaAtual(
  contas: DiagnosticoContaInput[],
  lancamentos: DiagnosticoLancamentoInput[],
  mes: string,
): number {
  const contasElegiveis = contas.filter(
    (c) => c.papel === Papel.CORRENTE || c.papel === Papel.RESERVA,
  );
  const limite = ultimoDiaDoMes(mes);

  return contasElegiveis.reduce((total, conta) => {
    const movimentacao = lancamentos
      .filter(
        (l) =>
          l.contaId === conta.id &&
          l.status === StatusLancamento.EFETIVADO &&
          toSPDateString(l.data) <= limite,
      )
      .reduce(
        (sum, l) => sum + (l.tipo === TipoLancamento.RECEITA ? l.valor : -l.valor),
        0,
      );
    return total + conta.saldoInicial + movimentacao;
  }, 0);
}

export function calcularMetaReserva(
  gastoMensalMedio: number,
  meses: number,
): number {
  return meses * gastoMensalMedio;
}

export function calcularDistribuicaoReal(
  renda: number,
  gastosFixos: number,
  gastosDiaADia: number,
  sobra: number,
): DistribuicaoReal {
  const ratio =
    gastosDiaADia > 0 ? gastosFixos / gastosDiaADia : 0;
  return {
    necessidades: renda > 0 ? (gastosFixos / renda) * 100 : 0,
    desejos: renda > 0 ? (gastosDiaADia / renda) * 100 : 0,
    poupanca: renda > 0 ? (sobra / renda) * 100 : 0,
    necessidadesDesejosRatio: Math.round(ratio * 100) / 100,
  };
}

export function calcularGastoMensalMedio(
  lancamentos: DiagnosticoLancamentoInput[],
  mes: string,
): number {
  const mesesCompletos: string[] = [];
  let cursor = mesAnterior(mes);
  for (let i = 0; i < 3; i++) {
    mesesCompletos.push(cursor);
    cursor = mesAnterior(cursor);
  }

  const totais: number[] = [];
  for (const m of mesesCompletos) {
    const total = lancamentos
      .filter(
        (l) =>
          l.tipo === TipoLancamento.DESPESA &&
          l.status === StatusLancamento.EFETIVADO &&
          l.transferenciaId === null &&
          estaNoMes(l.data, m),
      )
      .reduce((sum, l) => sum + l.valor, 0);
    totais.push(total);
  }

  const disponiveis = totais.filter((v) => v > 0);
  if (disponiveis.length === 0) return 0;
  const soma = disponiveis.reduce((sum, v) => sum + v, 0);
  return Math.round(soma / disponiveis.length);
}

export function calcularAnaliseCartao(
  lancamentos: DiagnosticoLancamentoInput[],
  contas: DiagnosticoContaInput[],
  mes: string,
  metaReducaoRatio: number,
): AnaliseCartao {
  const idsCartao = new Set(
    contas.filter((c) => c.papel === Papel.CARTAO).map((c) => c.id),
  );

  const despesasCartao = lancamentos.filter(
    (l) =>
      idsCartao.has(l.contaId) &&
      l.tipo === TipoLancamento.DESPESA &&
      l.transferenciaId === null,
  );

  const totalMesAtual = despesasCartao
    .filter((l) => estaNoMes(l.data, mes))
    .reduce((sum, l) => sum + l.valor, 0);

  const mesAnteriorStr = mesAnterior(mes);
  const totalMesAnterior = despesasCartao
    .filter((l) => estaNoMes(l.data, mesAnteriorStr))
    .reduce((sum, l) => sum + l.valor, 0);

  const variacao =
    totalMesAnterior > 0
      ? Math.round(((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 10000) / 100
      : null;

  const categorias = new Map<string, number>();
  for (const l of despesasCartao.filter((l) => estaNoMes(l.data, mes))) {
    const nome = l.categoria?.nome ?? "Sem categoria";
    categorias.set(nome, (categorias.get(nome) ?? 0) + l.valor);
  }

  const topCategorias = Array.from(categorias.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nome, total]) => ({ nome, total }));

  const metaReducao = Math.round(totalMesAtual * (1 - metaReducaoRatio));

  return {
    totalMesAtual,
    totalMesAnterior,
    variacao,
    topCategorias,
    metaReducao,
  };
}

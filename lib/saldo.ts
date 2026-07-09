import {
  StatusLancamento,
  TipoLancamento,
} from "@prisma/client";
import { parseDataLancamento } from "@/lib/lancamentos";

export type SaldoContaInput = {
  id: string;
  saldoInicial: number;
};

export type SaldoLancamentoInput = {
  tipo: TipoLancamento;
  valor: number;
  data: Date;
  contaId: string;
  status: StatusLancamento;
};

export type SeriePonto = {
  data: string;
  saldo: number;
};

export type SaldoResultado = {
  saldoAtual: number;
  serieProjetada: SeriePonto[];
  primeiroDiaNegativo: string | null;
};

const SP_TIME_ZONE = "America/Sao_Paulo";

export function toSPDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SP_TIME_ZONE,
  }).format(date);
}

function addDaysSP(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fimDoMesSP(referenceDate = new Date()): string {
  const spStr = toSPDateString(referenceDate);
  const [year, month] = spStr.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function saldoInicialTotal(contas: SaldoContaInput[]): number {
  return contas.reduce((sum, conta) => sum + conta.saldoInicial, 0);
}

function valorLiquido(lancamento: SaldoLancamentoInput): number {
  return lancamento.tipo === "RECEITA"
    ? lancamento.valor
    : -lancamento.valor;
}

export function calcularSaldoAtual(
  contas: SaldoContaInput[],
  lancamentos: SaldoLancamentoInput[],
  hoje: Date,
): number {
  const hojeStr = toSPDateString(hoje);
  const base = saldoInicialTotal(contas);
  return lancamentos
    .filter(
      (l) =>
        l.tipo !== "TRANSFERENCIA" &&
        l.status === StatusLancamento.EFETIVADO &&
        toSPDateString(l.data) <= hojeStr,
    )
    .reduce((sum, l) => sum + valorLiquido(l), base);
}

export function calcularSerieProjetada(
  contas: SaldoContaInput[],
  lancamentos: SaldoLancamentoInput[],
  hoje: Date,
  ate: Date,
): SaldoResultado {
  const hojeStr = toSPDateString(hoje);
  const ateStr = toSPDateString(ate);
  const saldoAtual = calcularSaldoAtual(contas, lancamentos, hoje);

  if (ateStr < hojeStr) {
    return { saldoAtual, serieProjetada: [], primeiroDiaNegativo: null };
  }

  const base = saldoInicialTotal(contas);
  const serie: SeriePonto[] = [];
  let primeiroDiaNegativo: string | null = null;

  let currentStr = hojeStr;
  while (true) {
    const saldo = lancamentos
      .filter(
        (l) =>
          l.tipo !== "TRANSFERENCIA" && toSPDateString(l.data) <= currentStr,
      )
      .reduce((sum, l) => sum + valorLiquido(l), base);

    serie.push({ data: currentStr, saldo });

    if (saldo < 0 && primeiroDiaNegativo === null) {
      primeiroDiaNegativo = currentStr;
    }

    if (currentStr === ateStr) break;
    currentStr = addDaysSP(currentStr, 1);
  }

  return { saldoAtual, serieProjetada: serie, primeiroDiaNegativo };
}

export function parseDataSaldo(dataStr: string): Date {
  return parseDataLancamento(dataStr);
}

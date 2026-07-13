export type TipoLancamento = "RECEITA" | "DESPESA";

export interface ContribuicaoSaldo {
  valor: number;
  tipo: TipoLancamento;
}

export interface LancamentoSaldo {
  valor: number;
  tipo: TipoLancamento;
  data: string;
}

export interface PontoSerie {
  data: string;
  saldo: number;
}

export function signedValue(l: {
  valor: number;
  tipo: TipoLancamento;
}): number {
  return l.tipo === "RECEITA" ? l.valor : -l.valor;
}

export function calcularSaldoAtual(
  saldoInicial: number,
  efetivados: ContribuicaoSaldo[]
): number {
  return efetivados.reduce((acc, l) => acc + signedValue(l), saldoInicial);
}

function* eachDayUtc(start: string, end: string): Generator<string> {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startMs = Date.UTC(sy, sm - 1, sd);
  const endMs = Date.UTC(ey, em - 1, ed);
  const oneDay = 86_400_000;
  for (let t = startMs; t <= endMs; t += oneDay) {
    const d = new Date(t);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    yield `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
}

export function calcularSerieProjetada(
  saldoInicial: number,
  hoje: string,
  horizonte: string,
  lancamentos: LancamentoSaldo[]
): PontoSerie[] {
  const sorted = [...lancamentos].sort((a, b) => a.data.localeCompare(b.data));
  const serie: PontoSerie[] = [];
  let running = saldoInicial;
  let i = 0;
  for (const day of eachDayUtc(hoje, horizonte)) {
    while (i < sorted.length && sorted[i].data <= day) {
      running += signedValue(sorted[i]);
      i++;
    }
    serie.push({ data: day, saldo: running });
  }
  return serie;
}

export function primeiroDiaNegativo(serie: PontoSerie[]): string | null {
  for (const p of serie) {
    if (p.saldo < 0) return p.data;
  }
  return null;
}

export function fimDoMesAtual(hoje: string): string {
  const [y, m] = hoje.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

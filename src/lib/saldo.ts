export type TipoLancamento = "RECEITA" | "DESPESA";

export interface ContribuicaoSaldo {
  valor: number;
  tipo: TipoLancamento;
}

export function calcularSaldoAtual(
  saldoInicial: number,
  efetivados: ContribuicaoSaldo[]
): number {
  return efetivados.reduce(
    (acc, l) => acc + (l.tipo === "RECEITA" ? l.valor : -l.valor),
    saldoInicial
  );
}

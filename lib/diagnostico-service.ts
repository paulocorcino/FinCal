import { getContasByUser } from "@/lib/contas";
import { getLancamentosByUser } from "@/lib/lancamentos";
import { materializarRecorrencias } from "@/lib/recorrencias";
import { getRendaLiquidaVigente } from "@/lib/renda-liquida";
import {
  calcularAnaliseCartao,
  calcularDistribuicaoReal,
  calcularGastoMensalMedio,
  calcularGastosDiaADia,
  calcularGastosFixos,
  calcularMetaReserva,
  calcularReservaAtual,
  calcularSobra,
  calcularTaxaPoupanca,
  ultimoDiaDoMes,
  type AnaliseCartao,
  type DistribuicaoReal,
  type DiagnosticoContaInput,
  type DiagnosticoLancamentoInput,
} from "@/lib/diagnostico";
import { DIAGNOSTICO_CONFIG } from "@/lib/diagnostico-config";

export type DiagnosticoMetrics = {
  mes: string;
  rendaLiquida: number;
  gastosFixos: number;
  gastosDiaADia: number;
  sobra: number;
  taxaPoupanca: number;
  reservaAtual: number;
  metaReserva: number;
  distribuicaoReal: DistribuicaoReal;
  gastoMensalMedio: number;
  analiseCartao: AnaliseCartao;
};

function mapConta(conta: {
  id: string;
  saldoInicial: number;
  papel: DiagnosticoContaInput["papel"];
}): DiagnosticoContaInput {
  return {
    id: conta.id,
    saldoInicial: conta.saldoInicial,
    papel: conta.papel,
  };
}

function mapLancamento(lancamento: {
  tipo: DiagnosticoLancamentoInput["tipo"];
  valor: number;
  data: Date;
  status: DiagnosticoLancamentoInput["status"];
  contaId: string;
  categoriaId?: string | null;
  recorrenciaId?: string | null;
  transferenciaId?: string | null;
  categoria?: { nome: string } | null;
}): DiagnosticoLancamentoInput {
  return {
    tipo: lancamento.tipo,
    valor: lancamento.valor,
    data: lancamento.data,
    status: lancamento.status,
    contaId: lancamento.contaId,
    categoriaId: lancamento.categoriaId,
    recorrenciaId: lancamento.recorrenciaId,
    transferenciaId: lancamento.transferenciaId,
    categoria: lancamento.categoria,
  };
}

export async function getDiagnosticoForUser(
  userId: string,
  mes: string,
): Promise<DiagnosticoMetrics | null> {
  const renda = await getRendaLiquidaVigente(userId, mes);
  if (!renda) {
    return null;
  }

  const end = ultimoDiaDoMes(mes);
  await materializarRecorrencias(userId, { end });

  const [contas, lancamentos] = await Promise.all([
    getContasByUser(userId),
    getLancamentosByUser(userId, { end }),
  ]);

  const rendaLiquida = renda.valor;
  const gastosFixos = calcularGastosFixos(lancamentos.map(mapLancamento), mes);
  const gastosDiaADia = calcularGastosDiaADia(
    lancamentos.map(mapLancamento),
    mes,
  );
  const sobra = calcularSobra(rendaLiquida, lancamentos.map(mapLancamento), mes);
  const taxaPoupanca = calcularTaxaPoupanca(sobra, rendaLiquida);
  const reservaAtual = calcularReservaAtual(
    contas.map(mapConta),
    lancamentos.map(mapLancamento),
    mes,
  );
  const gastoMensalMedio = calcularGastoMensalMedio(
    lancamentos.map(mapLancamento),
    mes,
  );
  const metaReserva = calcularMetaReserva(
    gastoMensalMedio,
    DIAGNOSTICO_CONFIG.RESERVA_MESES,
  );
  const distribuicaoReal = calcularDistribuicaoReal(
    rendaLiquida,
    gastosFixos,
    gastosDiaADia,
    sobra,
  );
  const analiseCartao = calcularAnaliseCartao(
    lancamentos.map(mapLancamento),
    contas.map(mapConta),
    mes,
    DIAGNOSTICO_CONFIG.CARTAO_META_REDUCAO,
  );

  return {
    mes,
    rendaLiquida,
    gastosFixos,
    gastosDiaADia,
    sobra,
    taxaPoupanca,
    reservaAtual,
    metaReserva,
    distribuicaoReal,
    gastoMensalMedio,
    analiseCartao,
  };
}

import { StatusLancamento } from "@prisma/client";
import { isAtrasado } from "@/lib/lancamentos";
import { addDaysSP, toSPDateString, type SaldoResultado } from "@/lib/saldo";

export type TipoAlerta = "ATRASADO" | "PROXIMO" | "PROJECAO_NEGATIVA";

export type Alerta = {
  tipo: TipoAlerta;
  titulo: string;
  mensagem: string;
  data?: string;
  count?: number;
};

export type AlertaLancamentoInput = {
  status: StatusLancamento;
  data: Date;
};

export function calcularAlertas(
  lancamentos: AlertaLancamentoInput[],
  saldo: SaldoResultado,
  hoje: Date,
  diasProximos = 7,
): Alerta[] {
  const alertas: Alerta[] = [];

  const atrasados = lancamentos.filter((l) => isAtrasado(l, hoje));
  if (atrasados.length > 0) {
    alertas.push({
      tipo: "ATRASADO",
      titulo: "Lançamentos atrasados",
      mensagem: `${atrasados.length} lançamento(s) atrasado(s).`,
      count: atrasados.length,
    });
  }

  const hojeStr = toSPDateString(hoje);
  const limiteStr = addDaysSP(hojeStr, diasProximos);
  const proximos = lancamentos.filter((l) => {
    if (l.status !== StatusLancamento.PENDENTE) return false;
    const dataStr = toSPDateString(l.data);
    return dataStr >= hojeStr && dataStr <= limiteStr;
  });
  if (proximos.length > 0) {
    alertas.push({
      tipo: "PROXIMO",
      titulo: "Vencimentos próximos",
      mensagem: `${proximos.length} lançamento(s) com vencimento nos próximos ${diasProximos} dias.`,
      count: proximos.length,
    });
  }

  if (saldo.primeiroDiaNegativo) {
    alertas.push({
      tipo: "PROJECAO_NEGATIVA",
      titulo: "Saldo projetado negativo",
      mensagem: `O saldo projetado fica negativo pela primeira vez em ${saldo.primeiroDiaNegativo}.`,
      data: saldo.primeiroDiaNegativo,
    });
  }

  return alertas;
}

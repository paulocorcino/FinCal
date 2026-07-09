import { getContasByUser } from "@/lib/contas";
import { getLancamentosByUser, parseDataLancamento } from "@/lib/lancamentos";
import {
  addDaysSP,
  calcularSerieProjetada,
  fimDoMesSP,
  toSPDateString,
  type SaldoResultado,
} from "@/lib/saldo";

const MAXIMO_HORIZONTE_DIAS = 365;

export type SaldoFilters = {
  contaId?: string;
  ate?: string;
};

export async function getSaldoForUser(
  userId: string,
  filters: SaldoFilters = {},
): Promise<SaldoResultado> {
  const todasContas = await getContasByUser(userId);
  const contas = filters.contaId
    ? todasContas.filter((c) => c.id === filters.contaId)
    : todasContas;

  const hoje = new Date();
  const hojeStr = toSPDateString(hoje);
  const maxAteStr = addDaysSP(hojeStr, MAXIMO_HORIZONTE_DIAS);

  const ateStr = filters.ate
    ? filters.ate <= maxAteStr
      ? filters.ate
      : maxAteStr
    : fimDoMesSP(hoje);
  const ate = parseDataLancamento(ateStr);

  const lancamentos = await getLancamentosByUser(userId, {
    contaId: filters.contaId,
    end: ateStr,
  });

  return calcularSerieProjetada(
    contas.map((c) => ({ id: c.id, saldoInicial: c.saldoInicial })),
    lancamentos.map((l) => ({
      tipo: l.tipo,
      valor: l.valor,
      data: l.data,
      contaId: l.contaId,
      status: l.status,
    })),
    hoje,
    ate,
  );
}

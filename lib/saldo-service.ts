import { getContasByUser } from "@/lib/contas";
import { getLancamentosByUser, parseDataLancamento } from "@/lib/lancamentos";
import {
  calcularSerieProjetada,
  fimDoMesSP,
  type SaldoResultado,
} from "@/lib/saldo";

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

  const lancamentos = await getLancamentosByUser(userId, {
    contaId: filters.contaId,
  });

  const hoje = new Date();
  const ate = filters.ate
    ? parseDataLancamento(filters.ate)
    : parseDataLancamento(fimDoMesSP(hoje));

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

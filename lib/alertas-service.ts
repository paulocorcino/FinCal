import { StatusLancamento } from "@prisma/client";
import { calcularAlertas, type Alerta } from "@/lib/alertas";
import { getLancamentosByUser } from "@/lib/lancamentos";
import { addDaysSP, toSPDateString } from "@/lib/saldo";
import { getSaldoForUser } from "@/lib/saldo-service";

export async function getAlertasForUser(
  userId: string,
  diasProximos = 7,
): Promise<Alerta[]> {
  const hoje = new Date();
  const hojeStr = toSPDateString(hoje);
  const ateStr = addDaysSP(hojeStr, diasProximos);

  const [lancamentos, saldo] = await Promise.all([
    getLancamentosByUser(userId, {
      status: StatusLancamento.PENDENTE,
      end: ateStr,
    }),
    getSaldoForUser(userId),
  ]);

  return calcularAlertas(lancamentos, saldo, hoje, diasProximos);
}

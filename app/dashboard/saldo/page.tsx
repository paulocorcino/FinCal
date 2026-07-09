import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getContasByUser } from "@/lib/contas";
import { getSaldoAction } from "@/app/actions/saldo";

export const dynamic = "force-dynamic";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

export default async function SaldoPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [contas, saldo] = await Promise.all([
    getContasByUser(session.user.id),
    getSaldoAction({
      contaId: searchParams.contaId,
      ate: searchParams.ate,
    }),
  ]);

  if (!saldo) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Saldo</h1>
      <Link href="/dashboard">Voltar</Link>

      <form>
        <label>
          Conta
          <select name="contaId" defaultValue={searchParams.contaId}>
            <option value="">Todas</option>
            {contas.map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Até
          <input type="date" name="ate" defaultValue={searchParams.ate} />
        </label>
        <button type="submit">Filtrar</button>
      </form>

      <section>
        <p data-testid="saldo-atual">
          Saldo atual: {formatCurrency(saldo.saldoAtual)}
        </p>
        {saldo.primeiroDiaNegativo && (
          <p data-testid="primeiro-dia-negativo">
            Primeiro dia negativo: {saldo.primeiroDiaNegativo}
          </p>
        )}
      </section>

      <section>
        <h2>Série projetada</h2>
        <ul data-testid="serie-projetada">
          {saldo.serieProjetada.map((ponto) => (
            <li key={ponto.data}>
              {ponto.data}: {formatCurrency(ponto.saldo)}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

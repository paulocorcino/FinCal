import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { toSPDateString } from "@/lib/saldo";
import { createRendaLiquidaAction } from "@/app/actions/renda-liquida";
import { getDiagnosticoAction } from "@/app/actions/diagnostico";

export const dynamic = "force-dynamic";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function mesAtual(): string {
  return toSPDateString(new Date()).slice(0, 7);
}

export default async function DiagnosticoPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const mes = mesAtual();
  const diagnostico = await getDiagnosticoAction(mes);

  if (!diagnostico) {
    return (
      <main>
        <h1>Diagnóstico Financeiro</h1>
        <nav>
          <Link href="/dashboard">Voltar ao dashboard</Link>
        </nav>
        <p>Informe sua renda líquida para liberar o diagnóstico.</p>
        <form action={createRendaLiquidaAction}>
          <label htmlFor="valor">Renda líquida mensal (R$)</label>
          <input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            required
          />
          <label htmlFor="vigenteDesde">Vigente desde</label>
          <input
            id="vigenteDesde"
            name="vigenteDesde"
            type="date"
            required
            defaultValue={`${mes}-01`}
          />
          <button type="submit">Salvar renda líquida</button>
        </form>
      </main>
    );
  }

  const { metrics, narrativa } = diagnostico;

  return (
    <main>
      <h1>Diagnóstico Financeiro</h1>
      <nav>
        <Link href="/dashboard">Voltar ao dashboard</Link>
      </nav>

      <section data-testid="diagnostico-metricas">
        <h2>Métricas de {metrics.mes}</h2>
        <p>Renda líquida: {formatCurrency(metrics.rendaLiquida)}</p>
        <p>Gastos fixos: {formatCurrency(metrics.gastosFixos)}</p>
        <p>Gastos do dia a dia: {formatCurrency(metrics.gastosDiaADia)}</p>
        <p>Sobra: {formatCurrency(metrics.sobra)}</p>
        <p>Taxa de poupança: {(metrics.taxaPoupanca * 100).toFixed(1)}%</p>
        <p>Reserva atual: {formatCurrency(metrics.reservaAtual)}</p>
        <p>Meta de reserva: {formatCurrency(metrics.metaReserva)}</p>
        <p>Gasto mensal médio: {formatCurrency(metrics.gastoMensalMedio)}</p>
        <p>
          Distribuição real: necessidades{" "}
          {metrics.distribuicaoReal.necessidades.toFixed(1)}%, desejos{" "}
          {metrics.distribuicaoReal.desejos.toFixed(1)}%, poupança{" "}
          {metrics.distribuicaoReal.poupanca.toFixed(1)}%
        </p>
        <p>
          Relação necessidades/desejos:{" "}
          {metrics.distribuicaoReal.necessidadesDesejosRatio}
        </p>
        <p>Cartão no mês: {formatCurrency(metrics.analiseCartao.totalMesAtual)}</p>
        {metrics.analiseCartao.topCategorias.length > 0 && (
          <ul>
            {metrics.analiseCartao.topCategorias.map((c) => (
              <li key={c.nome}>
                {c.nome}: {formatCurrency(c.total)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-testid="diagnostico-narrativa">
        <h2>Análise</h2>
        <pre>{narrativa}</pre>
      </section>
    </main>
  );
}

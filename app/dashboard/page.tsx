import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategoriesByUser } from "@/lib/categories";
import { getSaldoAction } from "@/app/actions/saldo";
import { getAlertasAction } from "@/app/actions/alertas";
import Link from "next/link";
import { LogoutButton } from "./logout-button";
import ProjectionChart from "@/app/components/projection-chart";

export const dynamic = "force-dynamic";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [categories, saldo, alertas] = await Promise.all([
    getCategoriesByUser(session.user.id),
    getSaldoAction({}),
    getAlertasAction(),
  ]);

  if (!saldo) {
    redirect("/login");
  }

  const saldoProjetadoMes = saldo.serieProjetada.at(-1)?.saldo ?? saldo.saldoAtual;

  return (
    <main>
      <h1>Dashboard</h1>
      <p data-testid="user-email">{session.user.email}</p>
      <LogoutButton />
      <nav>
        <Link href="/dashboard/contas">Contas</Link>
        <Link href="/dashboard/categorias">Categorias</Link>
        <Link href="/dashboard/lancamentos">Lançamentos</Link>
        <Link href="/dashboard/importacao">Importação Assistida</Link>
        <Link href="/dashboard/saldo">Saldo</Link>
        <Link href="/dashboard/agenda">Agenda</Link>
        <Link href="/dashboard/transferencias">Transferências</Link>
        <Link href="/dashboard/recorrencias">Recorrências</Link>
        <Link href="/dashboard/assistente">Assistente</Link>
        <Link href="/dashboard/diagnostico">Diagnóstico</Link>
      </nav>

      <section data-testid="saldo-cards">
        <p data-testid="saldo-atual">
          Saldo atual: {formatCurrency(saldo.saldoAtual)}
        </p>
        <p data-testid="saldo-projetado-mes">
          Saldo projetado no mês: {formatCurrency(saldoProjetadoMes)}
        </p>
      </section>

      <section>
        <h2>Projeção</h2>
        <ProjectionChart
          serieProjetada={saldo.serieProjetada}
          primeiroDiaNegativo={saldo.primeiroDiaNegativo}
        />
      </section>

      <section data-testid="alertas-panel">
        <h2>Alertas</h2>
        {alertas && alertas.length > 0 ? (
          <ul>
            {alertas.map((alerta, index) => (
              <li key={`${alerta.tipo}-${index}`}>{alerta.mensagem}</li>
            ))}
          </ul>
        ) : (
          <p>Sem alertas</p>
        )}
      </section>

      <h2>Categorias</h2>
      <ul>
        {categories.map((c) => (
          <li key={c.id}>
            {c.nome} ({c.tipo})
          </li>
        ))}
      </ul>
    </main>
  );
}

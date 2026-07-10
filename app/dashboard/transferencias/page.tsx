import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getContasByUser } from "@/lib/contas";
import { getTransferenciasByUser } from "@/lib/transferencias";
import {
  createTransferenciaAction,
  deleteTransferenciaAction,
} from "@/app/actions/transferencia";
import { TransferenciaForm } from "@/app/components/transferencia-form";

export const dynamic = "force-dynamic";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export default async function TransferenciasPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [contas, transferencias] = await Promise.all([
    getContasByUser(session.user.id),
    getTransferenciasByUser(session.user.id),
  ]);

  async function handleCreate(formData: FormData) {
    "use server";
    await createTransferenciaAction(formData);
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const transferenciaId = formData.get("transferenciaId") as string;
    await deleteTransferenciaAction(transferenciaId);
  }

  return (
    <main>
      <h1>Transferências</h1>
      <TransferenciaForm contas={contas} action={handleCreate} />

      <h2>Histórico</h2>
      {transferencias.length === 0 ? (
        <p>Nenhuma transferência registrada.</p>
      ) : (
        <ul>
          {transferencias.map((t) => (
            <li key={t.transferenciaId}>
              <span>
                {formatDate(t.data)} — {formatCurrency(t.valor)}
              </span>
              <span>
                {t.origem.nome} → {t.destino.nome}
              </span>
              <form action={handleDelete}>
                <input
                  type="hidden"
                  name="transferenciaId"
                  value={t.transferenciaId}
                />
                <button type="submit">Excluir</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

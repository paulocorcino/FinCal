import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getContasByUser } from "@/lib/contas";
import { getCategoriesByUser } from "@/lib/categories";
import {
  createRecorrenciaAction,
  updateRecorrenciaAction,
  deleteRecorrenciaAction,
  getRecorrenciasByUserAction,
} from "@/app/actions/recorrencia";
import {
  RecorrenciaForm,
  type RecorrenciaFormDefaultValues,
} from "@/app/components/recorrencia-form";
import { FrequenciaRecorrencia } from "@prisma/client";

export const dynamic = "force-dynamic";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

export default async function RecorrenciasPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [contas, categorias, recorrencias] = await Promise.all([
    getContasByUser(session.user.id),
    getCategoriesByUser(session.user.id),
    getRecorrenciasByUserAction(),
  ]);

  async function handleCreate(formData: FormData) {
    "use server";
    await createRecorrenciaAction(formData);
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await updateRecorrenciaAction(id, formData);
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deleteRecorrenciaAction(id);
  }

  return (
    <main>
      <h1>Recorrências</h1>
      <RecorrenciaForm contas={contas} categorias={categorias} action={handleCreate} />

      <h2>Regras</h2>
      <ul>
        {recorrencias.map((recorrencia) => (
          <li key={recorrencia.id}>
            <RecorrenciaForm
              id={recorrencia.id}
              contas={contas}
              categorias={categorias}
              defaultValues={{
                tipo: recorrencia.tipo,
                valor: recorrencia.valor,
                dataInicio: recorrencia.dataInicio,
                dataFim: recorrencia.dataFim ?? undefined,
                frequencia: recorrencia.frequencia,
                dia: recorrencia.dia,
                contaId: recorrencia.contaId,
                categoriaId: recorrencia.categoriaId,
              } as RecorrenciaFormDefaultValues}
              action={handleUpdate}
            />
            <span>
              {recorrencia.frequencia === FrequenciaRecorrencia.MENSAL
                ? "Mensal"
                : "Semanal"}{" "}
              - dia {recorrencia.dia}
            </span>
            <span>
              {formatCurrency(recorrencia.valor)} em {recorrencia.conta.nome} /{" "}
              {recorrencia.categoria.nome}
            </span>
            <form action={handleDelete}>
              <input type="hidden" name="id" value={recorrencia.id} />
              <button type="submit">Excluir</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}

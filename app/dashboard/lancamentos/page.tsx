import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getContasByUser } from "@/lib/contas";
import { getCategoriesByUser } from "@/lib/categories";
import {
  createLancamentoAction,
  updateLancamentoAction,
  deleteLancamentoAction,
  efetivarLancamentoAction,
  getLancamentosByUserAction,
} from "@/app/actions/lancamento";
import {
  editarOcorrenciaAction,
  excluirOcorrenciaAction,
  materializarRecorrenciasAction,
} from "@/app/actions/recorrencia";
import { StatusLancamento } from "@prisma/client";
import { isAtrasado } from "@/lib/lancamentos";
import {
  LancamentoForm,
  type LancamentoFormDefaultValues,
} from "@/app/components/lancamento-form";

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

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const start = searchParams.start;
  const end = searchParams.end;

  if (start && end) {
    await materializarRecorrenciasAction({ start, end });
  }

  const [contas, categorias, lancamentos] = await Promise.all([
    getContasByUser(session.user.id),
    getCategoriesByUser(session.user.id),
    getLancamentosByUserAction({
      start: searchParams.start,
      end: searchParams.end,
      contaId: searchParams.contaId,
      status: searchParams.status as StatusLancamento | undefined,
      excluirTransferencias: true,
    }),
  ]);

  async function handleCreate(formData: FormData) {
    "use server";
    await createLancamentoAction(formData);
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await updateLancamentoAction(id, formData);
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deleteLancamentoAction(id);
  }

  async function handleEfetivar(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await efetivarLancamentoAction(id, formData);
  }

  async function handleEditarOcorrencia(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await editarOcorrenciaAction(id, formData);
  }

  async function handleExcluirOcorrencia(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await excluirOcorrenciaAction(id, formData);
  }

  return (
    <main>
      <h1>Lançamentos</h1>
      <LancamentoForm
        contas={contas}
        categorias={categorias}
        action={handleCreate}
      />

      <h2>Filtros</h2>
      <form>
        <label>
          De
          <input type="date" name="start" defaultValue={searchParams.start} />
        </label>
        <label>
          Até
          <input type="date" name="end" defaultValue={searchParams.end} />
        </label>
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
          Status
          <select name="status" defaultValue={searchParams.status}>
            <option value="">Todos</option>
            <option value={StatusLancamento.PENDENTE}>PENDENTE</option>
            <option value={StatusLancamento.EFETIVADO}>EFETIVADO</option>
          </select>
        </label>
        <button type="submit">Filtrar</button>
      </form>

      <ul>
        {lancamentos.map((lancamento) => (
          <li key={lancamento.id}>
            <LancamentoForm
              id={lancamento.id}
              contas={contas}
              categorias={categorias}
              defaultValues={{
                tipo: lancamento.tipo,
                valor: lancamento.valor,
                data: lancamento.data.toISOString().slice(0, 10),
                contaId: lancamento.contaId,
                categoriaId: lancamento.categoriaId ?? "",
              } as LancamentoFormDefaultValues}
              action={handleUpdate}
            />
            <span>
              {lancamento.status}
              {lancamento.status === StatusLancamento.PENDENTE &&
                isAtrasado(lancamento) &&
                " (ATRASADO)"}
              {lancamento.recorrenciaId && " (recorrente)"}
            </span>
            <span>
              {lancamento.conta.nome} / {lancamento.categoria.nome}
            </span>
            <span>{formatDate(lancamento.data)}</span>
            <span>{formatCurrency(lancamento.valor)}</span>
            <form action={handleDelete}>
              <input type="hidden" name="id" value={lancamento.id} />
              <button type="submit">Excluir</button>
            </form>
            {lancamento.status === StatusLancamento.PENDENTE && (
              <form action={handleEfetivar}>
                <input type="hidden" name="id" value={lancamento.id} />
                <label>
                  Valor real (centavos)
                  <input
                    type="number"
                    name="valor"
                    step="1"
                    defaultValue={lancamento.valor}
                  />
                </label>
                <button type="submit">Efetivar</button>
              </form>
            )}
            {lancamento.recorrenciaId && (
              <>
                <h4>Editar ocorrência</h4>
                <form action={handleEditarOcorrencia}>
                  <input type="hidden" name="id" value={lancamento.id} />
                  <label>
                    Valor (centavos)
                    <input
                      type="number"
                      name="valor"
                      step="1"
                      defaultValue={lancamento.valor}
                    />
                  </label>
                  <label>
                    Escopo
                    <select name="escopo">
                      <option value="SOMENTE_ESTA">Só esta</option>
                      <option value="ESTA_E_FUTURAS">Esta e futuras</option>
                    </select>
                  </label>
                  <button type="submit">Salvar edição</button>
                </form>
                <form action={handleExcluirOcorrencia}>
                  <input type="hidden" name="id" value={lancamento.id} />
                  <label>
                    Escopo
                    <select name="escopo">
                      <option value="SOMENTE_ESTA">Só esta</option>
                      <option value="ESTA_E_FUTURAS">Esta e futuras</option>
                    </select>
                  </label>
                  <button type="submit">Excluir ocorrência</button>
                </form>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

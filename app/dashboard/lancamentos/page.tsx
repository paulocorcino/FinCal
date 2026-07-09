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
import { StatusLancamento } from "@prisma/client";
import { isAtrasado } from "@/lib/lancamentos";

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

function LancamentoForm({
  id,
  contas,
  categorias,
  defaultValues,
  action,
}: {
  id?: string;
  contas: { id: string; nome: string }[];
  categorias: { id: string; nome: string; tipo: string }[];
  defaultValues?: {
    tipo: string;
    valor: number;
    data: string;
    contaId: string;
    categoriaId: string;
  };
  action: (formData: FormData) => Promise<void>;
}) {
  const categoriaTipo = defaultValues?.categoriaId
    ? categorias.find((c) => c.id === defaultValues.categoriaId)?.tipo ??
      "DESPESA"
    : "DESPESA";

  return (
    <form action={action}>
      {id && <input type="hidden" name="id" value={id} />}
      <label>
        Tipo
        <select name="tipo" defaultValue={defaultValues?.tipo ?? "DESPESA"}>
          <option value="RECEITA">RECEITA</option>
          <option value="DESPESA">DESPESA</option>
        </select>
      </label>
      <label>
        Valor (centavos)
        <input
          type="number"
          name="valor"
          step="1"
          defaultValue={defaultValues?.valor ?? 0}
          required
        />
      </label>
      <label>
        Data
        <input
          type="date"
          name="data"
          defaultValue={defaultValues?.data}
          required
        />
      </label>
      <label>
        Conta
        <select name="contaId" defaultValue={defaultValues?.contaId} required>
          <option value="">Selecione</option>
          {contas.map((conta) => (
            <option key={conta.id} value={conta.id}>
              {conta.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Categoria
        <select
          name="categoriaId"
          defaultValue={defaultValues?.categoriaId}
          required
        >
          <option value="">Selecione</option>
          {categorias
            .filter((c) => c.tipo === categoriaTipo)
            .map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
        </select>
      </label>
      <button type="submit">{id ? "Salvar" : "Criar"}</button>
    </form>
  );
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

  const [contas, categorias, lancamentos] = await Promise.all([
    getContasByUser(session.user.id),
    getCategoriesByUser(session.user.id),
    getLancamentosByUserAction({
      start: searchParams.start,
      end: searchParams.end,
      contaId: searchParams.contaId,
      status: searchParams.status as StatusLancamento | undefined,
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
                categoriaId: lancamento.categoriaId,
              }}
              action={handleUpdate}
            />
            <span>
              {lancamento.status}
              {lancamento.status === StatusLancamento.PENDENTE &&
                isAtrasado(lancamento) &&
                " (ATRASADO)"}
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
          </li>
        ))}
      </ul>
    </main>
  );
}

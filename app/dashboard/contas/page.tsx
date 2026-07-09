import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createContaAction,
  updateContaAction,
  deleteContaAction,
  getContasByUserAction,
} from "@/app/actions/conta";

export const dynamic = "force-dynamic";

function ContaForm({
  id,
  defaultValues,
  action,
}: {
  id?: string;
  defaultValues?: { nome: string; saldoInicial: number; papel: string };
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      {id && <input type="hidden" name="id" value={id} />}
      <label>
        Nome
        <input
          type="text"
          name="nome"
          defaultValue={defaultValues?.nome}
          required
        />
      </label>
      <label>
        Saldo inicial (centavos)
        <input
          type="number"
          name="saldoInicial"
          step="1"
          defaultValue={defaultValues?.saldoInicial ?? 0}
          required
        />
      </label>
      <label>
        Papel
        <select name="papel" defaultValue={defaultValues?.papel ?? "CORRENTE"}>
          <option value="CORRENTE">CORRENTE</option>
          <option value="RESERVA">RESERVA</option>
          <option value="INVESTIMENTO">INVESTIMENTO</option>
          <option value="CARTAO">CARTAO</option>
        </select>
      </label>
      <button type="submit">{id ? "Salvar" : "Criar"}</button>
    </form>
  );
}

export default async function ContasPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const contas = await getContasByUserAction();

  async function handleCreate(formData: FormData) {
    "use server";
    await createContaAction(formData);
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await updateContaAction(id, formData);
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deleteContaAction(id);
  }

  return (
    <main>
      <h1>Contas</h1>
      <ContaForm action={handleCreate} />
      <ul>
        {contas.map((conta) => (
          <li key={conta.id}>
            <ContaForm
              id={conta.id}
              defaultValues={{
                nome: conta.nome,
                saldoInicial: conta.saldoInicial,
                papel: conta.papel,
              }}
              action={handleUpdate}
            />
            <form action={handleDelete}>
              <input type="hidden" name="id" value={conta.id} />
              <button type="submit">Excluir</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}

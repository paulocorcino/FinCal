import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createCategoriaAction,
  updateCategoriaAction,
  deleteCategoriaAction,
  getCategoriesByUserAction,
} from "@/app/actions/categoria";

export const dynamic = "force-dynamic";

function CategoriaForm({
  id,
  defaultValues,
  action,
}: {
  id?: string;
  defaultValues?: { nome: string; tipo: string };
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
        Tipo
        <select name="tipo" defaultValue={defaultValues?.tipo ?? "DESPESA"}>
          <option value="RECEITA">RECEITA</option>
          <option value="DESPESA">DESPESA</option>
        </select>
      </label>
      <button type="submit">{id ? "Salvar" : "Criar"}</button>
    </form>
  );
}

export default async function CategoriasPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const categorias = await getCategoriesByUserAction();

  async function handleCreate(formData: FormData) {
    "use server";
    await createCategoriaAction(formData);
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await updateCategoriaAction(id, formData);
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deleteCategoriaAction(id);
  }

  return (
    <main>
      <h1>Categorias</h1>
      <CategoriaForm action={handleCreate} />
      <ul>
        {categorias.map((categoria) => (
          <li key={categoria.id}>
            <CategoriaForm
              id={categoria.id}
              defaultValues={{
                nome: categoria.nome,
                tipo: categoria.tipo,
              }}
              action={handleUpdate}
            />
            <form action={handleDelete}>
              <input type="hidden" name="id" value={categoria.id} />
              <button type="submit">Excluir</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}

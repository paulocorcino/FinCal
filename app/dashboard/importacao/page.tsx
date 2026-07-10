import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getContasByUser } from "@/lib/contas";
import { getCategoriesByUser } from "@/lib/categories";
import { ImportacaoForm } from "@/app/components/importacao-form";

export const dynamic = "force-dynamic";

export default async function ImportacaoPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [contas, categorias] = await Promise.all([
    getContasByUser(session.user.id),
    getCategoriesByUser(session.user.id),
  ]);

  return (
    <main>
      <h1>Importação Assistida</h1>
      <ImportacaoForm contas={contas} categorias={categorias} />
    </main>
  );
}

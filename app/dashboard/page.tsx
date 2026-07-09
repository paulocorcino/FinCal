import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategoriesByUser } from "@/lib/categories";
import Link from "next/link";
import { LogoutButton } from "./logout-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const categories = await getCategoriesByUser(session.user.id);

  return (
    <main>
      <h1>Dashboard</h1>
      <p data-testid="user-email">{session.user.email}</p>
      <LogoutButton />
      <nav>
        <Link href="/dashboard/contas">Contas</Link>
        <Link href="/dashboard/categorias">Categorias</Link>
        <Link href="/dashboard/lancamentos">Lançamentos</Link>
      </nav>
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

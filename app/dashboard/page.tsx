import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategoriesByUser } from "@/lib/categories";
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

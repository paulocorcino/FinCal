import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AssistantChat from "@/app/components/assistant-chat";

export const dynamic = "force-dynamic";

export default async function AssistentePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Assistente</h1>
      <nav>
        <Link href="/dashboard">Voltar ao dashboard</Link>
      </nav>
      <AssistantChat />
    </main>
  );
}

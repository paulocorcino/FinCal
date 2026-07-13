import { listarContas } from "@/lib/conta-actions";
import { ContasScreen } from "@/components/contas/contas-screen";

export default async function ContasPage() {
  const contas = await listarContas();
  return <ContasScreen contas={contas} />;
}

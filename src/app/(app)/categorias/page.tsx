import { listarCategorias } from "@/lib/categoria-actions";
import { CategoriasScreen } from "@/components/categorias/categorias-screen";

export default async function CategoriasPage() {
  const categorias = await listarCategorias();
  return <CategoriasScreen categorias={categorias} />;
}

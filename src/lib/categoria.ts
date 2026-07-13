import type { TipoCategoria } from "@/lib/categorias-padrao";

export const TIPOS_CATEGORIA: TipoCategoria[] = ["RECEITA", "DESPESA"];

export function formatarTipoLabel(t: string): string {
  switch (t) {
    case "RECEITA":
      return "Receita";
    case "DESPESA":
      return "Despesa";
    default:
      return t;
  }
}

export function isTipoCategoria(value: unknown): value is TipoCategoria {
  return (
    typeof value === "string" &&
    (TIPOS_CATEGORIA as string[]).includes(value)
  );
}

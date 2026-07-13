import type { TipoLancamento } from "@/lib/saldo";

export type { TipoLancamento } from "@/lib/saldo";

export type StatusLancamento = "PENDENTE" | "EFETIVADO";

export const TIPOS_LANCAMENTO: TipoLancamento[] = ["RECEITA", "DESPESA"];

export const STATUSES_LANCAMENTO: StatusLancamento[] = [
  "PENDENTE",
  "EFETIVADO",
];

export function isTipoLancamento(value: unknown): value is TipoLancamento {
  return (
    typeof value === "string" &&
    (TIPOS_LANCAMENTO as string[]).includes(value)
  );
}

export function isStatusLancamento(value: unknown): value is StatusLancamento {
  return (
    typeof value === "string" &&
    (STATUSES_LANCAMENTO as string[]).includes(value)
  );
}

export function formatarStatusLabel(s: string): string {
  switch (s) {
    case "PENDENTE":
      return "Pendente";
    case "EFETIVADO":
      return "Efetivado";
    default:
      return s;
  }
}

export function formatarTipoLancamentoLabel(t: string): string {
  switch (t) {
    case "RECEITA":
      return "Receita";
    case "DESPESA":
      return "Despesa";
    default:
      return t;
  }
}

export function statusDefaultPorData(
  dataStr: string,
  hojeStr: string
): StatusLancamento {
  return dataStr <= hojeStr ? "EFETIVADO" : "PENDENTE";
}

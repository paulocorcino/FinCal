export type Papel = "CORRENTE" | "RESERVA" | "INVESTIMENTO" | "CARTAO";

export const PAPEIS: Papel[] = [
  "CORRENTE",
  "RESERVA",
  "INVESTIMENTO",
  "CARTAO",
];

export function formatarPapelLabel(p: Papel): string {
  switch (p) {
    case "CORRENTE":
      return "Corrente";
    case "RESERVA":
      return "Reserva";
    case "INVESTIMENTO":
      return "Investimento";
    case "CARTAO":
      return "Cartão";
  }
}

export function isPapel(value: unknown): value is Papel {
  return (
    typeof value === "string" &&
    (PAPEIS as string[]).includes(value)
  );
}

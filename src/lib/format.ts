const brlCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarBRL(cents: number): string {
  return brlCurrency.format(cents / 100);
}

export function parseCentavos(text: string): number {
  const digits = text.replace(/\D+/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10);
}

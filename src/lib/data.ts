export function hojeAmericaSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function isDataValida(s: unknown): s is string {
  if (typeof s !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [, mes, dia] = s.split("-").map(Number);
  if (mes < 1 || mes > 12) return false;
  if (dia < 1 || dia > 31) return false;
  if (Number.isNaN(Date.parse(`${s}T00:00:00`))) return false;
  const [y, m, d] = s.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= lastDay;
}

export function normalizarDataFromFormDDMMYYYY(
  digits: string
): string | null {
  const only = digits.replace(/\D+/g, "").slice(0, 8);
  if (only.length !== 8) return null;
  const dia = only.slice(0, 2);
  const mes = only.slice(2, 4);
  const ano = only.slice(4, 8);
  const iso = `${ano}-${mes}-${dia}`;
  return isDataValida(iso) ? iso : null;
}

export function formatarDataDDMMYYYY(iso: string): string {
  if (!isDataValida(iso)) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

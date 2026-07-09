import { toSPDateString } from "./saldo";

const MES_REGEX = /^\d{4}-\d{2}$/;

export function parseMes(mes: string): { ano: number; mes: number } {
  if (!MES_REGEX.test(mes)) {
    throw new Error("Mês deve estar no formato YYYY-MM");
  }
  const [ano, mesNumero] = mes.split("-").map(Number);
  if (mesNumero < 1 || mesNumero > 12) {
    throw new Error("Mês deve estar entre 01 e 12");
  }
  return { ano, mes: mesNumero };
}

export function mesAtualSP(referenceDate = new Date()): string {
  return toSPDateString(referenceDate).slice(0, 7);
}

export function primeiroDiaDoMesSP(mes: string): string {
  const { ano, mes: mesNumero } = parseMes(mes);
  return `${ano}-${String(mesNumero).padStart(2, "0")}-01`;
}

export function ultimoDiaDoMesSP(mes: string): string {
  const { ano, mes: mesNumero } = parseMes(mes);
  const lastDay = new Date(Date.UTC(ano, mesNumero, 0)).getUTCDate();
  return `${ano}-${String(mesNumero).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export function addMonthsSP(mes: string, delta: number): string {
  const { ano, mes: mesNumero } = parseMes(mes);
  const totalMonths = ano * 12 + (mesNumero - 1) + delta;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}

export function diaDaSemanaSP(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export type DiaDoMes = {
  data: string;
  diaDaSemana: number;
};

export function diasDoMesSP(mes: string): DiaDoMes[] {
  const inicio = primeiroDiaDoMesSP(mes);
  const fim = ultimoDiaDoMesSP(mes);
  const dias: DiaDoMes[] = [];

  let atual = inicio;
  while (atual <= fim) {
    dias.push({ data: atual, diaDaSemana: diaDaSemanaSP(atual) });
    const [year, month, day] = atual.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1, day + 1));
    const y = next.getUTCFullYear();
    const m = String(next.getUTCMonth() + 1).padStart(2, "0");
    const d = String(next.getUTCDate()).padStart(2, "0");
    atual = `${y}-${m}-${d}`;
  }

  return dias;
}

export function dataHojeSP(referenceDate = new Date()): string {
  return toSPDateString(referenceDate);
}

import { describe, expect, it } from "vitest";
import { signup } from "../app/actions/auth";
import { createLancamento, getLancamentosByUser, parseDataLancamento } from "../lib/lancamentos";
import { createConta } from "../lib/contas";
import { getCategoriesByUser } from "../lib/categories";
import { prisma } from "../lib/prisma";
import {
  addMonthsSP,
  diasDoMesSP,
  mesAtualSP,
  primeiroDiaDoMesSP,
  ultimoDiaDoMesSP,
} from "../lib/agenda";
import { toSPDateString } from "../lib/saldo";

async function createUserForm(email: string, password: string) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  return form;
}

describe("agenda integration", () => {
  it("groups Lançamentos by day within a month range", async () => {
    const email = "agenda-grouping@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    const conta = await createConta(user!.id, {
      nome: "Conta Agenda",
      saldoInicial: 0,
      papel: "CORRENTE",
    });

    const categoria = (await getCategoriesByUser(user!.id)).find(
      (c) => c.tipo === "DESPESA",
    )!;

    const mesBase = "2026-07";
    const l1 = await createLancamento(user!.id, {
      tipo: "DESPESA",
      valor: 1000,
      data: parseDataLancamento("2026-07-05"),
      contaId: conta.id,
      categoriaId: categoria.id,
    });
    const l2 = await createLancamento(user!.id, {
      tipo: "DESPESA",
      valor: 2000,
      data: parseDataLancamento("2026-07-05"),
      contaId: conta.id,
      categoriaId: categoria.id,
    });
    const l3 = await createLancamento(user!.id, {
      tipo: "DESPESA",
      valor: 3000,
      data: parseDataLancamento("2026-07-20"),
      contaId: conta.id,
      categoriaId: categoria.id,
    });
    const foraDoMes = await createLancamento(user!.id, {
      tipo: "DESPESA",
      valor: 4000,
      data: parseDataLancamento("2026-08-01"),
      contaId: conta.id,
      categoriaId: categoria.id,
    });

    const lista = await getLancamentosByUser(user!.id, {
      start: primeiroDiaDoMesSP(mesBase),
      end: ultimoDiaDoMesSP(mesBase),
    });

    const ids = lista.map((l) => l.id);
    expect(ids).toContain(l1.id);
    expect(ids).toContain(l2.id);
    expect(ids).toContain(l3.id);
    expect(ids).not.toContain(foraDoMes.id);

    const porDia = new Map<string, typeof lista>();
    for (const l of lista) {
      const dataStr = toSPDateString(l.data);
      const grupo = porDia.get(dataStr) ?? [];
      grupo.push(l);
      porDia.set(dataStr, grupo);
    }

    expect(porDia.get("2026-07-05")?.map((l) => l.id).sort()).toEqual(
      [l1.id, l2.id].sort(),
    );
    expect(porDia.get("2026-07-20")?.map((l) => l.id)).toEqual([l3.id]);
    expect(porDia.has("2026-08-01")).toBe(false);
  });

  it("creates a Lançamento from a selected day and keeps the SP date", async () => {
    const email = "agenda-create-day@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    const conta = await createConta(user!.id, {
      nome: "Conta Agenda Create",
      saldoInicial: 0,
      papel: "CORRENTE",
    });

    const categoria = (await getCategoriesByUser(user!.id)).find(
      (c) => c.tipo === "RECEITA",
    )!;

    const diaSelecionado = "2026-09-15";
    const criado = await createLancamento(user!.id, {
      tipo: "RECEITA",
      valor: 5500,
      data: parseDataLancamento(diaSelecionado),
      contaId: conta.id,
      categoriaId: categoria.id,
    });

    expect(toSPDateString(criado.data)).toBe(diaSelecionado);
  });

  it("navigates month boundaries via addMonthsSP and diasDoMesSP", () => {
    expect(addMonthsSP("2026-01", -1)).toBe("2025-12");
    expect(addMonthsSP("2026-12", 1)).toBe("2027-01");

    expect(diasDoMesSP("2026-02").length).toBe(28);
    expect(diasDoMesSP("2026-01").length).toBe(31);
    expect(diasDoMesSP("2026-04").length).toBe(30);

    const hoje = new Date("2026-07-09T12:00:00-03:00");
    expect(mesAtualSP(hoje)).toBe("2026-07");
  });
});

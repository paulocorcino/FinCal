import { describe, expect, it } from "vitest";

import { signup } from "../app/actions/auth";
import {
  createLancamento,
  updateLancamento,
  deleteLancamento,
  getLancamentosByUser,
  efetivarLancamento,
  isAtrasado,
  parseDataLancamento,
  addDays,
} from "../lib/lancamentos";
import { createConta } from "../lib/contas";
import { createCategoria, getCategoriesByUser } from "../lib/categories";
import { prisma } from "../lib/prisma";
import { StatusLancamento } from "@prisma/client";

async function createUserForm(email: string, password: string) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  return form;
}

function spDateStr(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

describe("lancamento integration", () => {
  it("creates, reads, updates and deletes a Lancamento with valor in cents", async () => {
    const email = "lancamento-user1@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    const conta = await createConta(user!.id, {
      nome: "Conta Corrente",
      saldoInicial: 100000,
      papel: "CORRENTE",
    });

    const categoria = await createCategoria(user!.id, {
      nome: "Lançamento Categoria",
      tipo: "DESPESA",
    });

    const dataStr = "2026-07-08";
    const created = await createLancamento(user!.id, {
      tipo: "DESPESA",
      valor: 12345,
      data: parseDataLancamento(dataStr),
      contaId: conta.id,
      categoriaId: categoria.id,
    });

    expect(created.valor).toBe(12345);
    expect(created.status).toBe(StatusLancamento.PENDENTE);
    expect(created.tipo).toBe("DESPESA");
    expect(created.userId).toBe(user!.id);

    const lista = await getLancamentosByUser(user!.id);
    expect(lista.map((l) => l.id)).toContain(created.id);

    const categoriaReceita = await createCategoria(user!.id, {
      nome: "Receita Categoria",
      tipo: "RECEITA",
    });

    const updated = await updateLancamento(user!.id, created.id, {
      tipo: "RECEITA",
      valor: 54321,
      data: parseDataLancamento("2026-07-09"),
      contaId: conta.id,
      categoriaId: categoriaReceita.id,
    });

    expect(updated.tipo).toBe("RECEITA");
    expect(updated.valor).toBe(54321);

    await deleteLancamento(user!.id, created.id);
    const afterDelete = await getLancamentosByUser(user!.id);
    expect(afterDelete.map((l) => l.id)).not.toContain(created.id);
  });

  it("efetiva a PENDENTE lancamento and allows adjusting the valor", async () => {
    const email = "lancamento-efetivar@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    const conta = await createConta(user!.id, {
      nome: "Conta Efetivar",
      saldoInicial: 0,
      papel: "CORRENTE",
    });

    const categoria = (await getCategoriesByUser(user!.id)).find(
      (c) => c.tipo === "RECEITA",
    );
    expect(categoria).toBeDefined();

    const created = await createLancamento(user!.id, {
      tipo: "RECEITA",
      valor: 10000,
      data: parseDataLancamento("2026-07-08"),
      contaId: conta.id,
      categoriaId: categoria!.id,
    });

    const efetivado = await efetivarLancamento(user!.id, created.id, 9999);
    expect(efetivado.status).toBe(StatusLancamento.EFETIVADO);
    expect(efetivado.valor).toBe(9999);

    const fromDb = await prisma.lancamento.findUnique({
      where: { id: created.id },
    });
    expect(fromDb?.status).toBe(StatusLancamento.EFETIVADO);
    expect(fromDb?.valor).toBe(9999);
  });

  it("efetiva keeping the original valor when no adjusted valor is provided", async () => {
    const email = "lancamento-efetivar-sem-valor@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    const conta = await createConta(user!.id, {
      nome: "Conta Efetivar Sem Valor",
      saldoInicial: 0,
      papel: "CORRENTE",
    });

    const categoria = (await getCategoriesByUser(user!.id)).find(
      (c) => c.tipo === "RECEITA",
    );
    expect(categoria).toBeDefined();

    const created = await createLancamento(user!.id, {
      tipo: "RECEITA",
      valor: 12345,
      data: parseDataLancamento("2026-07-08"),
      contaId: conta.id,
      categoriaId: categoria!.id,
    });

    const efetivado = await efetivarLancamento(user!.id, created.id);
    expect(efetivado.status).toBe(StatusLancamento.EFETIVADO);
    expect(efetivado.valor).toBe(12345);
  });

  it("rejects a lancamento whose categoria tipo does not match", async () => {
    const email = "lancamento-tipo@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    const conta = await createConta(user!.id, {
      nome: "Conta Tipo",
      saldoInicial: 0,
      papel: "CORRENTE",
    });

    const categoriaReceita = await createCategoria(user!.id, {
      nome: "Receita Only",
      tipo: "RECEITA",
    });

    await expect(
      createLancamento(user!.id, {
        tipo: "DESPESA",
        valor: 1000,
        data: parseDataLancamento("2026-07-08"),
        contaId: conta.id,
        categoriaId: categoriaReceita.id,
      }),
    ).rejects.toThrow("Categoria incompatível com o tipo do lançamento");
  });

  it("keeps each user's lancamentos isolated", async () => {
    const emailA = "lancamento-usera@example.com";
    const emailB = "lancamento-userb@example.com";
    await signup(await createUserForm(emailA, "password123"));
    await signup(await createUserForm(emailB, "password123"));

    const userA = await prisma.user.findUnique({ where: { email: emailA } });
    const userB = await prisma.user.findUnique({ where: { email: emailB } });
    expect(userA).not.toBeNull();
    expect(userB).not.toBeNull();

    const contaA = await createConta(userA!.id, {
      nome: "Conta A",
      saldoInicial: 0,
      papel: "CORRENTE",
    });
    const contaB = await createConta(userB!.id, {
      nome: "Conta B",
      saldoInicial: 0,
      papel: "CORRENTE",
    });

    const catA = (await getCategoriesByUser(userA!.id)).find(
      (c) => c.tipo === "DESPESA",
    )!;
    const catB = (await getCategoriesByUser(userB!.id)).find(
      (c) => c.tipo === "DESPESA",
    )!;

    const lancamentoA = await createLancamento(userA!.id, {
      tipo: "DESPESA",
      valor: 1000,
      data: parseDataLancamento("2026-07-08"),
      contaId: contaA.id,
      categoriaId: catA.id,
    });

    const lancamentoB = await createLancamento(userB!.id, {
      tipo: "DESPESA",
      valor: 2000,
      data: parseDataLancamento("2026-07-09"),
      contaId: contaB.id,
      categoriaId: catB.id,
    });

    const lancamentosA = await getLancamentosByUser(userA!.id);
    const lancamentosB = await getLancamentosByUser(userB!.id);

    expect(lancamentosA.map((l) => l.id)).toContain(lancamentoA.id);
    expect(lancamentosA.map((l) => l.id)).not.toContain(lancamentoB.id);
    expect(lancamentosB.map((l) => l.id)).toContain(lancamentoB.id);
    expect(lancamentosB.map((l) => l.id)).not.toContain(lancamentoA.id);

    for (const l of lancamentosA) {
      expect(l.userId).toBe(userA!.id);
    }
    for (const l of lancamentosB) {
      expect(l.userId).toBe(userB!.id);
    }
  });

  it("derives atrasado at Sao Paulo day boundaries", async () => {
    const email = "lancamento-atrasado@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    const conta = await createConta(user!.id, {
      nome: "Conta Atrasado",
      saldoInicial: 0,
      papel: "CORRENTE",
    });

    const categoria = (await getCategoriesByUser(user!.id)).find(
      (c) => c.tipo === "DESPESA",
    )!;

    const now = new Date();
    const hojeStr = spDateStr(now);
    const ontemStr = spDateStr(addDays(now, -1));
    const hojeMeiaNoite = parseDataLancamento(hojeStr, now);
    const primeiroInstanteAposMeiaNoite = new Date(
      hojeMeiaNoite.getTime() + 1,
    );

    const pendenteOntem = await createLancamento(user!.id, {
      tipo: "DESPESA",
      valor: 1000,
      data: parseDataLancamento(ontemStr, primeiroInstanteAposMeiaNoite),
      contaId: conta.id,
      categoriaId: categoria.id,
    });

    expect(
      isAtrasado(pendenteOntem, primeiroInstanteAposMeiaNoite),
    ).toBe(true);

    const pendenteHoje = await createLancamento(user!.id, {
      tipo: "DESPESA",
      valor: 1000,
      data: parseDataLancamento(hojeStr, primeiroInstanteAposMeiaNoite),
      contaId: conta.id,
      categoriaId: categoria.id,
    });

    expect(
      isAtrasado(pendenteHoje, primeiroInstanteAposMeiaNoite),
    ).toBe(false);

    const efetivadoOntem = await prisma.lancamento.update({
      where: { id: pendenteOntem.id },
      data: { status: StatusLancamento.EFETIVADO },
    });

    expect(
      isAtrasado(efetivadoOntem, primeiroInstanteAposMeiaNoite),
    ).toBe(false);
  });
});

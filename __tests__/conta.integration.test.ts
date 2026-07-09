import { describe, expect, it } from "vitest";

import { signup } from "../app/actions/auth";
import { contaSchema } from "../lib/conta-schema";
import {
  createConta,
  updateConta,
  deleteConta,
  getContasByUser,
} from "../lib/contas";
import { prisma } from "../lib/prisma";

async function createUserForm(email: string, password: string) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  return form;
}

describe("conta integration", () => {
  it("creates, reads, updates and deletes a Conta with integer saldoInicial", async () => {
    const email = "conta-user1@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    const created = await createConta(user!.id, {
      nome: "Banco Principal",
      saldoInicial: 12345,
      papel: "CORRENTE",
    });
    expect(created.nome).toBe("Banco Principal");
    expect(created.saldoInicial).toBe(12345);
    expect(created.papel).toBe("CORRENTE");
    expect(created.userId).toBe(user!.id);

    const list = await getContasByUser(user!.id);
    expect(list).toHaveLength(1);
    expect(list[0].saldoInicial).toBe(12345);

    const updated = await updateConta(user!.id, created.id, {
      nome: "Banco Principal Editado",
      saldoInicial: 54321,
      papel: "RESERVA",
    });
    expect(updated.nome).toBe("Banco Principal Editado");
    expect(updated.saldoInicial).toBe(54321);
    expect(updated.papel).toBe("RESERVA");

    await deleteConta(user!.id, created.id);
    const afterDelete = await getContasByUser(user!.id);
    expect(afterDelete).toHaveLength(0);
  });

  it("keeps each user's contas isolated", async () => {
    const emailA = "conta-usera@example.com";
    const emailB = "conta-userb@example.com";
    await signup(await createUserForm(emailA, "password123"));
    await signup(await createUserForm(emailB, "password123"));

    const userA = await prisma.user.findUnique({ where: { email: emailA } });
    const userB = await prisma.user.findUnique({ where: { email: emailB } });
    expect(userA).not.toBeNull();
    expect(userB).not.toBeNull();

    await createConta(userA!.id, {
      nome: "Conta A",
      saldoInicial: 1000,
      papel: "CORRENTE",
    });
    await createConta(userB!.id, {
      nome: "Conta B",
      saldoInicial: 2000,
      papel: "INVESTIMENTO",
    });

    const contasA = await getContasByUser(userA!.id);
    const contasB = await getContasByUser(userB!.id);

    expect(contasA).toHaveLength(1);
    expect(contasB).toHaveLength(1);
    expect(contasA[0].nome).toBe("Conta A");
    expect(contasB[0].nome).toBe("Conta B");
    expect(contasA[0].userId).toBe(userA!.id);
    expect(contasB[0].userId).toBe(userB!.id);
  });

  it("rejects missing or invalid papel via schema validation", () => {
    const missingPapel = contaSchema.safeParse({
      nome: "Sem Papel",
      saldoInicial: 100,
      papel: "",
    });
    expect(missingPapel.success).toBe(false);

    const invalidPapel = contaSchema.safeParse({
      nome: "Papel Inválido",
      saldoInicial: 100,
      papel: "INVALIDO",
    });
    expect(invalidPapel.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { signup } from "../app/actions/auth";
import { categoriaSchema } from "../lib/categoria-schema";
import {
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getCategoriesByUser,
} from "../lib/categories";
import { prisma } from "../lib/prisma";

async function createUserForm(email: string, password: string) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  return form;
}

describe("categoria integration", () => {
  it("creates, reads, updates and deletes a Categoria including pre-seeded ones", async () => {
    const email = "categoria-user1@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    const seeded = await getCategoriesByUser(user!.id);
    expect(seeded.length).toBeGreaterThan(0);
    const moradia = seeded.find((c) => c.nome === "Moradia");
    expect(moradia).toBeDefined();
    expect(moradia!.tipo).toBe("DESPESA");

    const updated = await updateCategoria(user!.id, moradia!.id, {
      nome: "Moradia Editada",
      tipo: "DESPESA",
    });
    expect(updated.nome).toBe("Moradia Editada");
    expect(updated.tipo).toBe("DESPESA");

    const created = await createCategoria(user!.id, {
      nome: "Nova Categoria",
      tipo: "RECEITA",
    });
    expect(created.nome).toBe("Nova Categoria");
    expect(created.tipo).toBe("RECEITA");
    expect(created.userId).toBe(user!.id);

    await deleteCategoria(user!.id, created.id);
    const afterDelete = await getCategoriesByUser(user!.id);
    expect(afterDelete.map((c) => c.id)).not.toContain(created.id);
  });

  it("keeps each user's categorias isolated", async () => {
    const emailA = "categoria-usera@example.com";
    const emailB = "categoria-userb@example.com";
    await signup(await createUserForm(emailA, "password123"));
    await signup(await createUserForm(emailB, "password123"));

    const userA = await prisma.user.findUnique({ where: { email: emailA } });
    const userB = await prisma.user.findUnique({ where: { email: emailB } });
    expect(userA).not.toBeNull();
    expect(userB).not.toBeNull();

    await createCategoria(userA!.id, { nome: "Categoria A", tipo: "RECEITA" });
    await createCategoria(userB!.id, { nome: "Categoria B", tipo: "DESPESA" });

    const categoriasA = await getCategoriesByUser(userA!.id);
    const categoriasB = await getCategoriesByUser(userB!.id);

    expect(categoriasA.map((c) => c.nome)).toContain("Categoria A");
    expect(categoriasA.map((c) => c.nome)).not.toContain("Categoria B");
    expect(categoriasB.map((c) => c.nome)).toContain("Categoria B");
    expect(categoriasB.map((c) => c.nome)).not.toContain("Categoria A");

    for (const c of categoriasA) {
      expect(c.userId).toBe(userA!.id);
    }
    for (const c of categoriasB) {
      expect(c.userId).toBe(userB!.id);
    }
  });

  it("rejects missing or invalid tipo via schema validation", () => {
    const missingTipo = categoriaSchema.safeParse({
      nome: "Sem Tipo",
      tipo: "",
    });
    expect(missingTipo.success).toBe(false);

    const invalidTipo = categoriaSchema.safeParse({
      nome: "Tipo Inválido",
      tipo: "INVALIDO",
    });
    expect(invalidTipo.success).toBe(false);
  });
});

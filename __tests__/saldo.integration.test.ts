import { describe, expect, it, vi } from "vitest";
import { GET } from "../app/api/saldo/route";
import { auth } from "@/lib/auth";
import { signup } from "../app/actions/auth";
import { createConta } from "../lib/contas";
import { getCategoriesByUser } from "../lib/categories";
import { createLancamento, parseDataLancamento, addDays } from "../lib/lancamentos";
import { prisma } from "../lib/prisma";
import { StatusLancamento } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

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

describe("saldo API", () => {
  it("retorna saldo consolidado e filtrado por conta", async () => {
    const email = "saldo-user1@example.com";
    await signup(await createUserForm(email, "password123"));
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    const contaA = await createConta(user!.id, {
      nome: "Conta A",
      saldoInicial: 10000,
      papel: "CORRENTE",
    });

    const contaB = await createConta(user!.id, {
      nome: "Conta B",
      saldoInicial: 5000,
      papel: "CORRENTE",
    });

    const categoriaReceita = (await getCategoriesByUser(user!.id)).find(
      (c) => c.tipo === "RECEITA",
    )!;
    const categoriaDespesa = (await getCategoriesByUser(user!.id)).find(
      (c) => c.tipo === "DESPESA",
    )!;

    const hoje = new Date();
    const hojeStr = spDateStr(hoje);
    const amanha = addDays(hoje, 1);
    const amanhaStr = spDateStr(amanha);

    await createLancamento(user!.id, {
      tipo: "RECEITA",
      valor: 2000,
      data: parseDataLancamento(hojeStr),
      contaId: contaA.id,
      categoriaId: categoriaReceita.id,
    });

    await createLancamento(user!.id, {
      tipo: "DESPESA",
      valor: 1000,
      data: parseDataLancamento(hojeStr),
      contaId: contaB.id,
      categoriaId: categoriaDespesa.id,
    });

    await createLancamento(user!.id, {
      tipo: "DESPESA",
      valor: 1000,
      data: parseDataLancamento(amanhaStr),
      contaId: contaB.id,
      categoriaId: categoriaDespesa.id,
    });

    await prisma.lancamento.updateMany({
      where: { userId: user!.id },
      data: { status: StatusLancamento.EFETIVADO },
    });

    await prisma.lancamento.updateMany({
      where: { userId: user!.id, data: { gte: parseDataLancamento(amanhaStr) } },
      data: { status: StatusLancamento.PENDENTE },
    });

    vi.mocked(auth).mockResolvedValue({
      user: { id: user!.id, email: user!.email },
    } as ReturnType<typeof auth>);

    const consolidado = await GET(
      new Request(`http://localhost:3000/api/saldo?ate=${amanhaStr}`),
    );
    const consolidadoBody = await consolidado.json();

    expect(consolidado.status).toBe(200);
    expect(consolidadoBody.saldoAtual).toBe(16000);
    expect(consolidadoBody.serieProjetada).toEqual([
      { data: hojeStr, saldo: 16000 },
      { data: amanhaStr, saldo: 15000 },
    ]);

    const filtrado = await GET(
      new Request(
        `http://localhost:3000/api/saldo?contaId=${contaA.id}&ate=${amanhaStr}`,
      ),
    );
    const filtradoBody = await filtrado.json();

    expect(filtrado.status).toBe(200);
    expect(filtradoBody.saldoAtual).toBe(12000);
    expect(filtradoBody.serieProjetada).toEqual([
      { data: hojeStr, saldo: 12000 },
      { data: amanhaStr, saldo: 12000 },
    ]);
  });
});

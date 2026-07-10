import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function toSPDateString(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function spTodayInputValue(): string {
  const parts = toSPDateString(new Date()).split("/");
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

test("caminho feliz: registrar, logar, criar conta, lançamento e conferir dashboard", async ({
  page,
}) => {
  const email = `smoke-${Date.now()}@example.com`;
  const password = "senha123";

  const smokeDir = path.resolve(process.cwd(), "e2e-results", "smoke");
  fs.mkdirSync(smokeDir, { recursive: true });

  await page.goto("/register");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await page.waitForURL("/login");

  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("/dashboard");

  await page.goto("/dashboard/contas");
  await page.getByLabel("Nome").fill("Conta Corrente");
  await page.getByLabel("Saldo inicial (centavos)").fill("100000");
  await page.getByRole("button", { name: "Criar" }).click();
  await expect(page.getByText("Conta Corrente")).toBeVisible();

  await page.goto("/dashboard/lancamentos");
  await page.locator('select[name="tipo"]').selectOption("RECEITA");
  await page.getByLabel("Valor (centavos)").fill("50000");
  await page.getByLabel("Data").fill(spTodayInputValue());
  await page.locator('select[name="contaId"]').selectOption({ label: "Conta Corrente" });
  await page.locator('select[name="categoriaId"]').selectOption({ label: "Salário" });
  await page.getByRole("button", { name: "Criar" }).click();
  await expect(page.getByText("R$ 500,00")).toBeVisible();
  await expect(page.getByText("Salário")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByTestId("saldo-projetado-mes")).toContainText("R$ 1.500,00");
  await page.screenshot({ path: path.join(smokeDir, "dashboard.png") });

  await page.goto("/dashboard/lancamentos");
  await expect(page.getByText("R$ 500,00")).toBeVisible();
  await expect(page.getByText("Salário")).toBeVisible();
  await page.screenshot({ path: path.join(smokeDir, "lancamentos.png") });
});

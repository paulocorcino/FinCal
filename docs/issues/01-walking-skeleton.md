# Walking skeleton: Next.js + Prisma + SQLite + Dockerfile

## What to build

Esqueleto executável ponta a ponta da stack (ADR-0001): um app Next.js (App Router, TypeScript) com Prisma sobre SQLite, uma página que **lê algo do banco** para provar a conexão, e um `Dockerfile` único que roda a app com `prisma migrate deploy` no start, apontando `DATABASE_URL` para um arquivo em volume persistente (ex.: `/data/fincal.db`).

> **Já existem no repo (não recriar):** `.env` (ignorado pelo git, **contém segredos reais — NUNCA sobrescrever, commitar, logar ou imprimir em evidências**) e `.env.example` (versionado, com placeholders). O app deve **ler** essas variáveis (`DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`); se faltar alguma no `.env.example`, adicione-a lá (só placeholder) e no `.env` se aplicável — sem tocar nos valores existentes.

## Acceptance criteria

- [ ] `npm run dev` sobe a app; uma rota renderiza um valor vindo do SQLite via Prisma
- [ ] Migrations do Prisma configuradas; `prisma migrate deploy` roda no start do container
- [ ] `Dockerfile` builda e roda; SQLite persiste em volume (`DATABASE_URL="file:/data/fincal.db"`)
- [ ] Vitest configurado com um teste trivial passando
- [ ] App lê as variáveis do `.env` existente; `.env.example` mantido em dia (só placeholders); `.env` permanece intocado e no gitignore
- [ ] Evidência: log do container subindo + página lendo o banco

## Blocked by

None - can start immediately.

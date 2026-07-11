# Walking skeleton: casca deployável ponta a ponta

## What to build

O esqueleto andante do FinCal AI: um app Next.js (App Router) + Prisma + **SQLite em disco persistente** (ADR-0001) + Auth.js que **sobe, conecta no banco e renderiza uma rota**. Já traz a **casca de UI** do contrato: **sidebar persistente** (colapsa em drawer < `lg`) com os seis destinos na ordem definida, **topbar** com "＋ Novo Lançamento" e botão do Assistente (placeholders), tema claro único (Tailwind + shadcn/ui). Uma página protegida qualquer (ex.: Dashboard vazio com `EmptyState`) renderiza para provar o caminho. Deployável como container tradicional com volume (não serverless).

## Acceptance criteria

- [ ] `npm run dev` sobe; Prisma conecta no SQLite (`DATABASE_URL="file:..."`); `migrate` cria o schema base
- [ ] Casca renderiza: sidebar (6 destinos na ordem do `ui-ux.md`) + topbar; colapsa em drawer < `lg`, sem scroll horizontal até ~360px (ADR-0005)
- [ ] Tailwind + shadcn/ui configurados; tokens de cor/tipografia definidos uma vez; tema claro único
- [ ] Uma rota autenticada renderiza um `EmptyState` padronizado (ícone + 1 linha + 1 CTA)
- [ ] `Dockerfile` único builda a imagem; `.env.example` com placeholders (`DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`)
- [ ] Evidência: screenshot da casca renderizada + saída do build/migrate

## Blocked by

- None - can start immediately

# Walking Skeleton: casca autenticável, sidebar e topbar

## What to build

O esqueleto que todas as fatias seguintes preenchem: projeto Next.js (App Router) + Prisma + SQLite
em disco persistente (ADR-0001) rodando localmente, com a **casca de navegação** do design system
(`docs/ui/mock/design.md`) já de pé — **sidebar esquerda persistente** com os **seis destinos** na
ordem definida (Dashboard, Agenda, Contas, Categorias, Importação Assistida, Diagnóstico), cada um
como rota própria (mesmo que a página ainda seja um placeholder), e **topbar** com o botão "＋ Novo
Lançamento" e o botão do Assistente (ambos podem ser no-op nesta fatia). Sem sidebar/topbar quando não
autenticado. Nenhum item solto tipo "Lançamentos"/"Relatórios" — só os seis destinos.

## Acceptance criteria

- [ ] `npx prisma migrate dev` roda contra SQLite em arquivo (não in-memory); schema tem ao menos `user`
- [ ] Casca renderiza: sidebar com os **seis** destinos na ordem certa + topbar; colapsa em drawer
      abaixo de `lg` (1024px), sem scroll horizontal até ~360px (ADR-0005)
- [ ] Cada destino é uma rota navegável (placeholder aceitável); item ativo destacado na sidebar
- [ ] Tokens de cor/tipografia/forma do `docs/ui/mock/design.md` aplicados (Tailwind configurado com
      os tokens do frontmatter, fontes Geist/Inter carregadas)
- [ ] `.env.example` com `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL` (placeholders)
- [ ] Evidência: app rodando localmente + screenshot da casca em desktop e em viewport `< lg`

## Blocked by

None - can start immediately

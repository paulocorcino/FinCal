# Issues locais — FinCal AI

Este diretório é a **fonte da verdade** dos issues. Eles são criados aqui localmente e enviados ao GitHub **sob demanda, repetidas vezes** (este repo avalia o trabalho de agentes, então os mesmos issues são subidos a cada rodada). Os IDs do GitHub mudam a cada upload; por isso o campo **"Blocked by" referencia o número/arquivo da fatia local**, nunca um número do GitHub.

## Publicar no GitHub

Rode quantas vezes precisar. **Cada execução é destrutiva por design:** ela **apaga permanentemente todos os issues do repo (abertos e fechados)** e recria a leva a partir destes arquivos — para resetar o board a cada rodada de avaliação.

- PowerShell: `pwsh scripts/publish-issues.ps1`
- Bash: `bash scripts/publish-issues.sh`

Cada arquivo `NN-*.md`: a **primeira linha `# Título`** vira o título do issue; o resto vira o corpo. Todos recebem o label `needs-triage`.

## Convenções globais (valem para TODOS os issues — não repetidas em cada um)

Cada fatia é um **tracer bullet**: corta schema → API → UI → testes e é demonstrável sozinha. Ao implementar, respeite sempre:

- **Vocabulário**: use os termos do [`CONTEXT.md`](../../CONTEXT.md) na íntegra (Lançamento, Conta, Papel, Status, Recorrência, Transferência, Saldo Projetado, etc.). Respeite os ADRs em [`docs/adr/`](../adr/).
- **Isolamento**: toda entidade tem `userId`; **toda query filtra por ele**. Em contexto de IA, o `userId` vem **da sessão**, nunca de argumento gerado pelo modelo (ADR-0004).
- **Dinheiro**: inteiro em **centavos**; formatação só na UI. Nunca `float`.
- **Datas**: date-only; todo cálculo de "hoje"/atrasado/horizonte usa o fuso único `America/Sao_Paulo`.
- **Saldo**: sempre **derivado** dos Lançamentos (ADR-0002); a Conta guarda só `saldoInicial`.
- **IA**: nunca é fonte da verdade numérica (ADR-0004) — números vêm do motor; a IA traduz/narra. OpenAI **mockada** nos testes.
- **Stack**: Next.js (App Router) + Prisma + SQLite + Auth.js; TypeScript ponta a ponta; testes em Vitest.
- **Ambiente/segredos**: `.env` (ignorado pelo git) já existe e **contém segredos reais** — nunca sobrescrever, commitar, logar ou incluir em evidências. `.env.example` (versionado) tem os placeholders. Variáveis: `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`. Novas variáveis vão para o `.env.example` (só placeholder).
- **Definition of Done**: código + testes passando + **evidência** anexada (saída de teste / screenshot) de que o comportamento funciona ponta a ponta. O executor escolhe as ferramentas; o resultado com evidência é obrigatório.

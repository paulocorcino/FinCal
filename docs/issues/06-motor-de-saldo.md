# Motor de Saldo: Saldo Atual e série de Saldo Projetado

## What to build

O **Motor de Saldo** — módulo profundo, coração do produto (ADR-0002): funções **puras**, sem I/O e
sem LLM, sobre `Lançamentos[] + Saldo Inicial`. `saldoAtual(contas, lançamentos, hoje)` =
`saldoInicial + Σ EFETIVADOS até hoje`. `serieSaldoProjetado(contas, lançamentos, horizonte) →
{ data, valor }[]` = série diária somando EFETIVADOS + PENDENTES até cada dia, horizonte padrão fim do
mês corrente. Um derivador do **1º dia em que o saldo projetado cruza abaixo de zero**. Consolidado
(todas as Contas) por padrão, parametrizável por Conta única. Este motor é a única fonte numérica de
saldo em todo o app — nenhuma tela recalcula por conta própria.

## Acceptance criteria

- [ ] `saldoAtual`: soma só EFETIVADOS até hoje; PENDENTE nunca entra no Saldo Atual
- [ ] `serieSaldoProjetado`: soma EFETIVADOS + PENDENTES por dia até o horizonte; retorna série diária, não um número único
- [ ] Identifica corretamente o 1º dia com saldo projetado negativo (ou nenhum, se a série nunca cruza)
- [ ] Casos de borda: mês de 31 dias; Lançamento exatamente no limite do horizonte; nenhum Lançamento; consolidado vs. filtrado por uma Conta
- [ ] Horizonte configurável (aceita qualquer data-alvo, default fim do mês)
- [ ] Sem I/O — funções puras testáveis isoladamente, sem tocar Prisma/rede
- [ ] Evidência: suíte Vitest cobrindo os casos de borda acima

## Blocked by

- Slice 05 (lancamento-pontual)

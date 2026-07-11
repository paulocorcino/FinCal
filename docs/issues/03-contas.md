# Contas: CRUD com Papel, Saldo Inicial e Saldo Atual derivado

## What to build

CRUD de **Conta** com nome, **Papel** (`CORRENTE`/`RESERVA`/`INVESTIMENTO`/`CARTAO`) e **Saldo Inicial** (âncora, em centavos). A Conta **não** materializa saldo (ADR-0002): o **Saldo Atual derivado** é exibido a partir dos Lançamentos EFETIVADOS (nesta fatia, sem Lançamentos ainda, o derivado = Saldo Inicial — a fórmula já entra pronta para o motor da Slice 06). `CARTAO` é Conta genérica (sem lógica de fatura; saldo pode ficar negativo). Tela com `EmptyState` quando não há Contas; exclusão via `AlertDialog`.

## Acceptance criteria

- [ ] Criar/editar/excluir Conta (nome, Papel, Saldo Inicial em centavos via `CurrencyInput`)
- [ ] Saldo Atual exibido é **derivado**, nunca um campo materializado na Conta (ADR-0002)
- [ ] `CARTAO` aceita saldo negativo; sem lógica de fatura
- [ ] `EmptyState` padronizado quando não há Contas; exclusão passa por `AlertDialog`
- [ ] Todas as queries filtram por `userId`
- [ ] Evidência: teste do CRUD + derivação de saldo + screenshot da tela cheia e vazia

## Blocked by

- Slice 02 (auth)

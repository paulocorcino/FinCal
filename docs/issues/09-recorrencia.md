# Recorrência: regra, materialização lazy e escopo de edição

## What to build

A **Recorrência** como **regra** (tipo, valor, categoria, conta, frequência, dia, data de início, data de fim opcional) que **materializa Lançamentos concretos de forma preguiçosa** (lazy, sem cron — ADR-0003): ao navegar para um mês ou projetar até uma data, o sistema materializa as ocorrências que faltam até ali. Cada ocorrência é um Lançamento normal com `recorrenciaId` — o motor de saldo, a Agenda e o Dashboard tratam recorrente e pontual de forma idêntica. Editar/excluir uma ocorrência com `recorrenciaId` **sempre** dispara o **diálogo de escopo compartilhado** — **"Só esta"** (marca a ocorrência como modificada, imune à regeneração) vs **"Esta e as futuras"** (altera a regra e regenera futuras não-modificadas). Nunca edição retroativa. Lançamento sem `recorrenciaId` não mostra o diálogo.

## Acceptance criteria

- [ ] Criar Recorrência (frequência, dia, início, fim opcional); ocorrências materializam **lazy** ao navegar/projetar (sem cron)
- [ ] Cada ocorrência é um Lançamento com `recorrenciaId`; materialização **idempotente** (não duplica ao rodar de novo)
- [ ] Editar/excluir ocorrência com `recorrenciaId` dispara o diálogo de escopo compartilhado (Só esta / Esta e as futuras)
- [ ] "Só esta" preserva a ocorrência modificada na regeneração; "Esta e as futuras" altera futuras não-modificadas sem tocar o passado
- [ ] Lançamento sem `recorrenciaId` não mostra o diálogo
- [ ] Evidência: testes de idempotência da materialização e dos dois escopos + screenshot do diálogo

## Blocked by

- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)
- Slice 07 (agenda-mensal)

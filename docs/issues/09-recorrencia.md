# Recorrência: regra, materialização lazy e escopo de edição

## What to build

A **Recorrência** como **regra** (tipo, valor, categoria, conta, frequência `MENSAL`/`SEMANAL`, dia,
data de início, data de fim opcional) que **materializa Lançamentos concretos de forma preguiçosa**
(lazy, sem cron — ADR-0003): ao navegar para um mês ou projetar até uma data, o sistema materializa as
ocorrências que faltam até ali. Cada ocorrência é um Lançamento normal com `recorrenciaId` — o motor de
saldo, a Agenda e o Dashboard tratam recorrente e pontual de forma idêntica. **Criação:** liga-se pelo
toggle **"Repetir"** dentro do modal de Lançamento (Slice 05) — desligado por padrão; ligar revela
inline frequência, dia e fim opcional, e o submit cria a `recorrencia` em vez de um Lançamento avulso.
Nenhum fluxo/modal separado. **Edição/exclusão:** um Lançamento com `recorrenciaId` **sempre** dispara
o **diálogo de escopo compartilhado** — **"Só esta"** (marca a ocorrência como modificada, imune à
regeneração) vs **"Esta e as futuras"** (altera a regra e regenera futuras não-modificadas). Nunca
edição retroativa. Lançamento sem `recorrenciaId` não mostra o diálogo.

## Acceptance criteria

- [ ] Toggle "Repetir" no modal de Lançamento (desligado por padrão) revela frequência/dia/fim opcional inline
- [ ] Criar Recorrência pelo toggle materializa a primeira ocorrência e a regra fica ativa
- [ ] Ocorrências materializam **lazy** ao navegar/projetar (sem cron); materialização **idempotente** (`UNIQUE(recorrenciaId, data)` — rodar duas vezes não duplica)
- [ ] Cada ocorrência é um Lançamento comum com `recorrenciaId`
- [ ] Editar/excluir ocorrência com `recorrenciaId` dispara o diálogo de escopo (Só esta / Esta e as futuras)
- [ ] "Só esta" preserva a ocorrência modificada na regeneração; "Esta e as futuras" altera futuras não-modificadas sem tocar o passado
- [ ] Lançamento sem `recorrenciaId` não mostra o diálogo
- [ ] Excluir a `recorrencia` faz `SET NULL` em `recorrenciaId` das ocorrências já materializadas (viram Lançamentos pontuais comuns, histórico preservado)
- [ ] Evidência: testes de idempotência da materialização e dos dois escopos + screenshot do toggle e do diálogo

## Blocked by

- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)
- Slice 07 (agenda-mensal)

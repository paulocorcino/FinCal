# Recorrência: regra que materializa Lançamentos (lazy)

## What to build

**Recorrência** (ver `CONTEXT.md` e ADR-0003): uma regra (tipo, valor, categoria, conta, frequência [mensal/semanal], dia, data de início, data de fim opcional) que **materializa Lançamentos concretos de forma preguiçosa (sem cron)** — ao navegar para um mês ou projetar até uma data, o sistema gera as ocorrências que faltam até ali. Cada ocorrência é um Lançamento normal com `recorrenciaId`. Edição/exclusão em **dois escopos**: **só esta** (marca a ocorrência como modificada, imune à regeneração) e **esta e as futuras** (altera a regra e regenera futuras não-modificadas). Sem edição retroativa. UI para criar/editar recorrências e escolher o escopo ao editar uma ocorrência.

## Acceptance criteria

- [ ] Criar Recorrência gera ocorrências como Lançamentos com `recorrenciaId`
- [ ] Materialização lazy ao navegar/projetar; sem job de background
- [ ] Editar "só esta" não é sobrescrito pela regeneração
- [ ] Editar "esta e futuras" atualiza a regra e regenera futuras não-modificadas
- [ ] Ocorrências recorrentes entram no motor de saldo como Lançamentos comuns
- [ ] Testes: dia 10 caindo em fim de semana, recorrência com data-fim, escopo de edição preservando modificadas
- [ ] Evidência: criação + ambos os escopos de edição demonstrados

## Blocked by

- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)

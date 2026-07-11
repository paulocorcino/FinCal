# Transferência: par vinculado neutro entre Contas

## What to build

A **Transferência** como **ação separada** ("Nova Transferência": origem, destino, valor, data) que produz um **par vinculado** — saída na origem + entrada no destino, mesmo valor e data, mesmo `transferenciaId`. É **neutra**: move saldo entre Contas mas **não conta como Receita nem como Despesa** nos totais (não distorce gastos, renda nem Taxa de Poupança). Renderizada com cor **neutra** (cinza/azul), nunca verde nem vermelho. **Nunca** montada como Despesa+Receita à mão, **nunca** dentro do modal de Lançamento comum. Editar/excluir opera sobre o par vinculado de forma consistente.

## Acceptance criteria

- [ ] Ação "Nova Transferência" (origem, destino, valor, data) cria o par vinculado com `transferenciaId`
- [ ] O par é **neutro**: excluído de totais de Receita/Despesa e da Taxa de Poupança, mas afeta o saldo das duas Contas
- [ ] Renderizada com cor neutra (nunca verde/vermelho); nunca dentro do modal de Lançamento comum
- [ ] Editar/excluir mantém o par consistente (ambas as pernas)
- [ ] Queries filtram por `userId`; ambas as Contas são do próprio usuário
- [ ] Evidência: teste de que a Transferência move saldo mas não entra em Receita/Despesa + screenshot

## Blocked by

- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)

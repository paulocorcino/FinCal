# Transferência: par vinculado neutro entre Contas

## What to build

A **Transferência** como **ação separada** ("Nova Transferência": origem, destino, valor, data) que
produz um **par vinculado** — saída na origem + entrada no destino, mesmo valor e data, mesmo
`transferenciaId` (sem tabela própria — TRA-01). É **neutra**: move saldo entre Contas mas **não conta
como Receita nem como Despesa** nos totais (não distorce gastos, renda nem Taxa de Poupança). Renderizada
com cor **neutra** (nunca verde nem vermelho). **Nunca** montada como Despesa+Receita à mão, **nunca**
dentro do modal de Lançamento comum. **Edição:** clicar numa perna na Agenda **reabre o mesmo formulário
"Nova Transferência" pré-preenchido** em edição — qualquer alteração (valor, data, contas) reescreve as
duas pernas atomicamente pelo caminho único de escrita (`criarTransferencia`/editar, TRA-02). **Exclusão**
sempre remove o **par inteiro**, nunca uma perna isolada.

## Acceptance criteria

- [ ] Ação "Nova Transferência" (origem, destino, valor, data) cria o par vinculado com `transferenciaId`
- [ ] O par é **neutro**: excluído de totais de Receita/Despesa e da Taxa de Poupança, mas afeta o saldo das duas Contas
- [ ] Renderizada com cor neutra (nunca verde/vermelho); nunca dentro do modal de Lançamento comum
- [ ] Clicar numa perna na Agenda reabre "Nova Transferência" pré-preenchido em edição (não o modal de Lançamento)
- [ ] Editar reescreve as duas pernas atomicamente (mesma operação de serviço, nunca uma perna sem a outra)
- [ ] Excluir remove sempre o par inteiro, nunca uma perna isolada
- [ ] Queries filtram por `userId`; ambas as Contas são do próprio usuário
- [ ] Evidência: teste de que a Transferência move saldo mas não entra em Receita/Despesa + teste de atomicidade da edição/exclusão do par + screenshot

## Blocked by

- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)

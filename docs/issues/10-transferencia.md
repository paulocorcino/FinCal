# Transferência entre Contas (neutra)

## What to build

**Transferência** (ver `CONTEXT.md`): movimentação entre duas Contas do próprio usuário, modelada como um **par vinculado** (saída na origem + entrada no destino, mesmo valor e data, mesmo `transferenciaId`). É **neutra**: move saldo entre Contas mas **não conta como Receita nem Despesa** — o motor de saldo e o Diagnóstico devem ignorá-la nos totais de renda/gasto e na Taxa de Poupança. UI para registrar uma transferência (origem, destino, valor, data).

## Acceptance criteria

- [ ] Registrar transferência cria o par vinculado por `transferenciaId`
- [ ] Saldo da origem diminui e do destino aumenta; consolidado inalterado
- [ ] Transferência **não** aparece em totais de gasto/renda
- [ ] Excluir uma transferência remove o par inteiro
- [ ] Teste: uma transferência não altera "gastos do mês" nem a Taxa de Poupança
- [ ] Evidência: transferência demonstrada com saldos antes/depois

## Blocked by

- Slice 03 (contas)
- Slice 06 (motor-de-saldo)

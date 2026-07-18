# Lançamento pontual: modal compartilhado e primitivos de borda

## What to build

O **Lançamento** (Tipo, valor, Conta, Categoria, data, Status) via um **modal único compartilhado**
(shadcn `Dialog`) reaberto de todo ponto de entrada (botão global "＋ Novo Lançamento" nesta fatia; a
Agenda ganha seus próprios pontos de entrada na Slice 07). **Status default por data** (editável):
data no passado → `EFETIVADO`; hoje/futuro → `PENDENTE`. Zero Contas cadastradas → o modal não mostra
formulário, mostra "Crie uma Conta primeiro" com atalho para Contas. O modal já reserva (mas deixa
desligado) o toggle **"Repetir"** que a Slice 09 liga para criar Recorrência — nesta fatia ele não
aparece ainda, para não acoplar as duas fatias. Fecha com **dirty-form guard**: alterações não salvas
pedem confirmação (`AlertDialog`) antes de descartar.

## Acceptance criteria

- [ ] Criar Lançamento (Tipo, valor, Conta, Categoria, data, Status) pelo modal compartilhado
- [ ] Status default deriva da data (passado → `EFETIVADO`, hoje/futuro → `PENDENTE`), editável
- [ ] `<CurrencyInput>` compartilhado: máscara `R$ 1.234,56` na UI, converte para inteiro em centavos na borda — nunca `float`
- [ ] `<DateField>` compartilhado: `dd/MM/yyyy`, date-only, ancorado em `America/Sao_Paulo`, sem `new Date()` ingênuo
- [ ] Editar e excluir Lançamento (exclusão com `AlertDialog`)
- [ ] `categoriaId` obrigatório em Lançamento comum (perna de Transferência fica fora desta fatia, ver Slice 10)
- [ ] Zero Contas → modal mostra "Crie uma Conta primeiro" em vez do formulário
- [ ] Fechar modal com alterações não salvas pede confirmação (dirty-form guard)
- [ ] Toda escrita gera **toast** de sucesso/erro
- [ ] Evidência: teste dos utilitários de borda (dinheiro↔centavos, data date-only) + screenshot do modal

## Blocked by

- Slice 03 (contas)
- Slice 04 (categorias)

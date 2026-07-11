# Lançamento pontual: modal compartilhado e camada de serviço

## What to build

Registrar um **Lançamento** (Tipo, valor, Conta, Categoria, data, Status) via o **modal compartilhado** (shadcn `Dialog`) — um único componente de formulário aberto de todos os pontos de entrada (topbar "＋ Novo Lançamento"; depois Agenda). Introduz os primitivos transversais: **`<CurrencyInput>`** (máscara `R$ 1.234,56` → **centavos inteiros** na borda form→serviço) e **`<DateField>`** (`dd/MM/yyyy`, date-only, `America/Sao_Paulo`). **Default de Status por data** (passado → `EFETIVADO`; hoje/futuro → `PENDENTE`), editável. **Efetivar** um `PENDENTE` permite ajustar o valor previsto para o real (transição total, sem parcial). Cada escrita → **toast**. Estabelece a **camada de serviço** (`criarLancamento`/`editarLancamento`/`excluirLancamento`/`efetivarLancamento`), caminho único de escrita, sempre no `userId` da sessão. Modal com **zero Contas** mostra "Crie uma Conta primeiro" em vez do formulário.

## Acceptance criteria

- [ ] Modal compartilhado cria/edita Lançamento; mesmo componente reusado (nunca duplicado por tela)
- [ ] `<CurrencyInput>` converte para **centavos inteiros** (nunca float); `<DateField>` date-only ancorado em `America/Sao_Paulo`
- [ ] Default de Status por data, editável; **efetivar** PENDENTE→EFETIVADO ajustando o valor (sem parcial)
- [ ] Excluir passa por `AlertDialog`; toda escrita gera **toast** (sucesso/erro)
- [ ] Camada de serviço filtra por `userId`; modal com zero Contas mostra atalho "Crie uma Conta primeiro"
- [ ] Evidência: testes da camada de serviço (isolamento por `userId`, centavos, status por data) + screenshot do modal

## Blocked by

- Slice 03 (contas)
- Slice 04 (categorias)

# Contas: CRUD com Saldo Inicial e Papel

## What to build

CRUD de **Conta** (ver `CONTEXT.md`): cada Conta tem nome, `saldoInicial` (centavos) e um **Papel** (`CORRENTE` | `RESERVA` | `INVESTIMENTO` | `CARTAO`). A Conta **não** guarda saldo corrente — só o inicial (ADR-0002). UI para listar/criar/editar/excluir, tudo escopado por `userId`.

## Acceptance criteria

- [ ] Criar/editar/excluir Conta com nome, saldoInicial (centavos) e Papel
- [ ] Papel selecionável entre os quatro valores
- [ ] Listagem só mostra Contas do usuário logado
- [ ] Teste: saldoInicial persiste em centavos; Papel obrigatório
- [ ] Evidência: CRUD completo demonstrado

## Blocked by

- Slice 02 (auth)

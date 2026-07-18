# Contas: CRUD e Saldo Atual derivado

## What to build

CRUD de **Conta** (nome, **Papel** ∈ `CORRENTE`/`RESERVA`/`INVESTIMENTO`/`CARTAO`, **Saldo Inicial**)
na tela "Contas", usando o padrão **modal** compartilhado (poucos campos, `docs/ui/mock/design.md` —
Forms & CRUD). A Conta **nunca guarda saldo materializado** (ADR-0002): a lista mostra o **Saldo Atual
derivado** (`saldoInicial + Σ Lançamentos EFETIVADOS até hoje`) calculado pelo motor, não uma coluna do
banco. Papel `CARTAO` é uma Conta genérica — sem lógica de fatura, saldo pode ficar negativo. Exclusão
passa por `AlertDialog`; excluir uma Conta com Lançamentos/Recorrências vinculados falha com o erro do
serviço (`ON DELETE RESTRICT`, CAT-05) e a UI mostra esse erro.

## Acceptance criteria

- [ ] Criar Conta (nome, papel, Saldo Inicial em centavos via `<CurrencyInput>`) pelo modal
- [ ] Editar Conta (papel é editável; não há campo imutável aqui — Conta não tem chave natural)
- [ ] Lista de Contas mostra Saldo Atual **derivado**, nunca uma coluna de saldo persistida
- [ ] `AlertDialog` de confirmação em toda exclusão
- [ ] Excluir Conta com Lançamentos/Recorrências vinculados mostra o erro do serviço (`RESTRICT`), não bloqueia client-side
- [ ] Toda query filtra por `userId`
- [ ] Evidência: teste de que Saldo Atual nunca é lido de uma coluna + screenshot do modal e da lista

## Blocked by

- Slice 02 (auth)

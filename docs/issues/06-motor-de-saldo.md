# Motor de saldo: atual e projetado (série diária)

## What to build

O coração determinístico e testável (ADR-0002). Funções **puras** que, a partir dos Lançamentos + `saldoInicial`, calculam: **Saldo Atual** (= saldoInicial + Σ EFETIVADOS até hoje) e **Saldo Projetado** como **série diária** ao longo de um horizonte (`saldoProjetado(D) = saldoInicial + Σ Lançamentos com data ≤ D`, EFETIVADOS ou PENDENTES). Consolidado (todas as Contas) por padrão, filtrável por Conta. Horizonte padrão = fim do mês corrente, mas aceita qualquer data-alvo. Expor via API e exibir o número atual/projetado numa página simples.

## Acceptance criteria

- [ ] Saldo Atual e série diária de Saldo Projetado calculados como funções puras
- [ ] Consolidado por padrão; filtro por Conta
- [ ] Horizonte configurável; padrão fim do mês
- [ ] API retorna a série; página exibe atual + projetado
- [ ] Testes de borda: mês de 31 dias, saldo cruzando zero (identifica o 1º dia negativo), Lançamento no limite do horizonte, sem Lançamentos
- [ ] Evidência: saída dos testes cobrindo os casos de borda

## Blocked by

- Slice 05 (lancamento-pontual)

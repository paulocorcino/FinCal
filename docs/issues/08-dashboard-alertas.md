# Dashboard financeiro e Alertas

## What to build

Dashboard com a fotografia da situação financeira: **Saldo Atual**, **Saldo Projetado** do mês, e o **gráfico da série diária de projeção** (destacando o 1º dia em que cruza abaixo de zero, se houver). Mais o painel de **Alertas** — todos **derivados/calculados**, sem persistência (ver `CONTEXT.md`): (1) Lançamentos atrasados, (2) vencimentos próximos (PENDENTES nos próximos N dias, N=7 configurável), (3) Saldo Projetado negativo em algum dia do horizonte (com o dia do 1º cruzamento).

## Acceptance criteria

- [ ] Cards de Saldo Atual e Projetado do mês
- [ ] Gráfico da série diária de projeção
- [ ] Três tipos de Alerta, todos calculados na hora (nada persistido)
- [ ] Alerta de projeção negativa aponta o 1º dia de cruzamento
- [ ] Teste: cada alerta dispara/não dispara nas condições corretas
- [ ] Evidência: dashboard com alertas demonstrado

## Blocked by

- Slice 06 (motor-de-saldo)

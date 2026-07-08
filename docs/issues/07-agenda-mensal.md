# Agenda mensal: calendário de Lançamentos

## What to build

Visão de calendário mensal mostrando os Lançamentos de cada dia (entradas/saídas, com indicação visual de PENDENTE/EFETIVADO/atrasado). Navegação entre meses. Clicar num dia mostra os Lançamentos daquele dia; permite criar um Lançamento já com a data pré-preenchida.

## Acceptance criteria

- [ ] Grade mensal com os Lançamentos posicionados por data
- [ ] Distinção visual entre Receita/Despesa e entre Status (incl. atrasado derivado)
- [ ] Navegação mês anterior/próximo
- [ ] Criar Lançamento a partir de um dia da agenda
- [ ] Datas coerentes com o fuso `America/Sao_Paulo` (sem off-by-one)
- [ ] Evidência: navegação e exibição demonstradas

## Blocked by

- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)

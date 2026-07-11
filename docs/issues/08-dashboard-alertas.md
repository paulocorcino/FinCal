# Dashboard e Alertas: landing com projeção e sinais

## What to build

O **Dashboard** (landing pós-login), nesta ordem: (1) linha de **cards** — **Saldo Atual** e **Saldo Projetado (fim do mês)**, cor pela tabela semântica; (2) **gráfico de linha** da projeção diária (shadcn Charts/Recharts — lib única), **destacando o 1º dia que cruza abaixo de zero**; (3) **painel de Alertas** — **atrasados**, vencimentos **próximos** (PENDENTE nos próximos N dias) e **saldo projetado negativo** — todos **calculados na hora** (nunca persistidos, ADR-0002), **cada um clicável levando à Agenda filtrada** (deep-links da Slice 07). Dashboard vazio (sem Contas) usa `EmptyState` com CTA "Criar sua primeira Conta". O **N dias** é configurável no menu de usuário (default 7).

## Acceptance criteria

- [ ] Cards de Saldo Atual e Projetado (fim do mês) coloridos pela tabela semântica
- [ ] Gráfico de linha da projeção com marcador de perigo no 1º dia negativo (shadcn Charts, lib única)
- [ ] Painel de Alertas (atrasados, próximos N dias, projeção negativa) calculado na hora; cada um linka à Agenda filtrada
- [ ] N dias configurável no menu de usuário (default 7); Dashboard vazio usa `EmptyState` "Criar sua primeira Conta"
- [ ] Evidência: testes do motor de Alertas (bordas: próximos = N dias, projeção negativa detecta qualquer dia < 0) + screenshot

## Blocked by

- Slice 06 (motor-de-saldo)
- Slice 07 (agenda-mensal)

# Dashboard e Alertas: landing de previsibilidade

## What to build

O **Dashboard** como landing pós-login: **cards** de Saldo Atual e Saldo Projetado (fim do mês),
coloridos pela tabela semântica; **gráfico de linha** (shadcn Charts sobre Recharts) da projeção
diária, destacando o **1º dia que cruza abaixo de zero** (marcador + cor de perigo); **painel de
Alertas** — atrasados (PENDENTE com data < hoje), vencimentos próximos (PENDENTE nos próximos N dias,
default 7, configurável no menu de usuário) e projeção negativa — calculados **na hora** pelo Motor de
Sinais Derivados, nunca persistidos. **Cada Alerta é clicável** e leva à Agenda já filtrada
(`?status=atrasado`, `?proximos=1`, etc., Slice 07). Dashboard sem nenhuma Conta usa o `EmptyState`
padronizado com CTA "Criar sua primeira Conta".

## Acceptance criteria

- [ ] Cards de Saldo Atual e Saldo Projetado (fim do mês) vindos do Motor de Saldo (Slice 06), cor pela tabela semântica
- [ ] Gráfico de linha da série de projeção diária, com marcador no 1º dia negativo (se existir)
- [ ] Painel de Alertas: atrasados, próximos N dias, projeção negativa — todos derivados em runtime, nunca lidos de coluna persistida
- [ ] Cada Alerta é um link que abre a Agenda com o filtro de URL correspondente
- [ ] N dias do alerta "próximos" é configurável (default 7) e o Dashboard reflete a mudança
- [ ] Zero Contas → `EmptyState` "Criar sua primeira Conta", nunca um dashboard quebrado
- [ ] Evidência: teste do Motor de Sinais Derivados (atrasado/próximos/projeção negativa) + screenshot do Dashboard

## Blocked by

- Slice 06 (motor-de-saldo)
- Slice 07 (agenda-mensal)

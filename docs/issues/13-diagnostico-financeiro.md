# Diagnóstico Financeiro: métricas determinísticas narradas pela IA

## What to build

O **Diagnóstico** (stretch, construído por último), gated pela **Renda Líquida**: sem ela, `EmptyState`
"Informe sua Renda Líquida" (leva ao menu de usuário), nunca uma tela meio-quebrada. Renda Líquida é
**append-only** (valor + "vigente desde", REN-01) — editar no menu de usuário sempre **cria uma nova
vigência**, nunca sobrescreve uma linha passada; "valor atual" é a de maior `vigenteDesde` ≤ hoje.
Layout: **cards de métrica determinística** vindos do Motor de Sinais Derivados — **Taxa de Poupança**
(`sobra ÷ Renda Líquida`, piso 10%, meta ~20%), **Reserva atual × meta** (`6 × gasto mensal médio` das
Despesas EFETIVADAS dos últimos 3 meses, excluindo Transferências, com barra de progresso) e **sobra**;
depois um **painel de narração da IA** que **referencia** esses números sem produzir números novos; e um
**disclaimer educacional** fixo, sempre visível. Fronteira visual clara entre números (motor) e narração
(IA), reforçando ADR-0004.

## Acceptance criteria

- [ ] Sem Renda Líquida informada → `EmptyState` "Informe sua Renda Líquida", nunca layout quebrado
- [ ] Editar Renda Líquida sempre cria uma nova linha (`vigenteDesde`), nunca sobrescreve uma vigência passada
- [ ] "Valor atual" = maior `vigenteDesde` ≤ hoje, calculado em runtime
- [ ] Cards de Taxa de Poupança, Reserva atual × meta (barra de progresso) e sobra vêm do Motor de Sinais Derivados, nunca da IA
- [ ] Meta de Reserva = `6 × gasto mensal médio` dos últimos 3 meses completos de Despesas EFETIVADAS, excluindo Transferências, com fallback para histórico menor que 3 meses
- [ ] Painel de narração da IA referencia os números dos cards sem inventar valores; OpenAI mockada nos testes
- [ ] Disclaimer educacional fixo e sempre visível na tela
- [ ] Evidência: teste das métricas determinísticas (Taxa de Poupança, meta de Reserva, fallback de histórico curto) + screenshot da tela

## Blocked by

- Slice 06 (motor-de-saldo)

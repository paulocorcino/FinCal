# Diagnóstico Financeiro: métricas do motor narradas pela IA

## What to build

O **Diagnóstico Financeiro** (stretch, construído por último). **Gated pela Renda Líquida**: primeiro, o usuário informa a **Renda Líquida** com vigência (valor + "vigente desde", histórico simples) no menu de usuário; sem ela → `EmptyState` "Informe sua Renda Líquida" (nunca tela meio-quebrada). Layout: (1) **cards de métrica determinística** vindos do **motor** (nunca da IA) — **Taxa de Poupança** (`sobra ÷ Renda Líquida`; <10% perigo, ~20% saudável), **Reserva atual × meta** (`6 × gasto mensal médio` = média das Despesas EFETIVADAS dos últimos 3 meses completos, excluindo Transferências; fallback se <3 meses) com **barra de progresso**, e **sobra**; (2) **painel de narração da IA** que **referencia** esses números, nunca produz números novos (ADR-0004); (3) **disclaimer educacional em banner fixo**, sempre visível. Reaproveita o motor: gastos fixos = Despesas com Recorrência; dia a dia = Despesas pontuais. Fronteira visual entre números (cards) e narração (painel). OpenAI **mockada** nos testes.

## Acceptance criteria

- [ ] Renda Líquida com vigência (valor + "vigente desde") editável no menu de usuário; sem ela → `EmptyState`
- [ ] Cards determinísticos do **motor**: Taxa de Poupança, Reserva atual × meta (barra de progresso), sobra
- [ ] Meta de Reserva = `6 × gasto mensal médio` (Despesas EFETIVADAS últimos 3 meses, excluindo Transferências; fallback <3 meses); Reserva atual = Σ CORRENTE+RESERVA
- [ ] Painel de narração da IA **referencia** os números do motor, nunca cria números; disclaimer educacional fixo sempre visível
- [ ] Evidência: testes das métricas (bordas: fallback <3 meses, Transferências excluídas) + teste com IA mockada narrando os números do motor + screenshot

## Blocked by

- Slice 06 (motor-de-saldo)
- Slice 09 (recorrencia)

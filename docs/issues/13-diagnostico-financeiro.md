# Diagnóstico Financeiro (consultor por IA)

## What to build

**Diagnóstico Financeiro** (ver `CONTEXT.md` e ADR-0004; *stretch — construir por último*). Entrada única: **Renda Líquida** declarada, armazenada **com vigência** (valor + "vigente desde"). Sem ela, o Diagnóstico não aparece. Um **motor determinístico** calcula (reaproveitando o motor de saldo): gastos fixos (= despesas com Recorrência), gastos do dia a dia (= despesas pontuais), sobra (= renda − gastos, ignorando Transferências), **Taxa de Poupança** (sobra ÷ Renda Líquida), **Reserva atual** (saldo das Contas `RESERVA`/`CORRENTE`, excluindo `INVESTIMENTO`/`CARTAO`) vs **meta** (6 × gasto mensal médio dos últimos 3 meses), distribuição real vs alvo (60/30/10, com 50/30/20 como referência) e análise do **cartão** (top categorias, variação vs mês anterior, meta de redução sugerida). As razões (120, 0,1, 6, 0,3, 1,66) são **constantes configuradas**. A **IA apenas narra** recomendações sobre esses fatos já calculados — **sem inventar números** — e o texto explicita a premissa do ×120 (~10% a.a.; 4% seria ~×300) e traz **disclaimer** educacional.

## Acceptance criteria

- [ ] Renda Líquida com vigência; diagnóstico usa a vigente no mês
- [ ] Métricas calculadas deterministicamente (poupança, reserva vs meta, distribuição, cartão)
- [ ] Gasto mensal médio = média das Despesas efetivadas dos últimos 3 meses (fallback ao histórico disponível)
- [ ] Razões como constantes configuráveis; premissa do ×120 explícita no texto
- [ ] IA narra sobre os números calculados, não os gera; disclaimer presente
- [ ] Testes cobrindo cada métrica (IA mockada)
- [ ] Evidência: diagnóstico gerado a partir de dados de exemplo

## Blocked by

- Slice 06 (motor-de-saldo)
- Slice 09 (recorrencia)

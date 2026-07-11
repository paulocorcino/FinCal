# Agenda mensal: grade de Lançamentos e entrada contextual

## What to build

A **Agenda** — navegador primário de Lançamentos (não existe página de lista/tabela separada). **Grade mensal de 7 colunas**; cada Lançamento é um **chip compacto** cuja **cor vem do Tipo** e o **estilo do Status/atrasado** (tabela semântica do `ui-ux.md`): Receita verde `+`, Despesa vermelho `−`, Transferência neutra; EFETIVADO sólido, PENDENTE contorno, atrasado com acento âmbar/vermelho (nunca um quarto status). Máx. ~3 chips/dia; excedente vira **"+N mais"**. **Clicar num dia** → detalhe (popover) com os Lançamentos + "Novo Lançamento" com **data pré-preenchida** (reusa o modal da Slice 05). **Clicar num chip** → mesmo modal em edição. **Filtros por URL** (`?status=atrasado`, `?conta=…`, `?proximos=1`) para os deep-links dos Alertas. Mobile: grade **colapsa em lista vertical de dias**. Cor nunca é canal único (cor + ícone/sinal).

## Acceptance criteria

- [ ] Grade mensal 7 colunas; chips com cor por Tipo e estilo por Status/atrasado (tabela semântica)
- [ ] Máx. ~3 chips/dia com "+N mais"; "Atrasado" é derivado (PENDENTE vencido), nunca persistido
- [ ] Clique no dia → popover + "Novo Lançamento" com data pré-preenchida (mesmo modal da Slice 05); clique no chip → modal em edição
- [ ] Filtros por URL (`status`, `conta`, `proximos`) refletem na grade
- [ ] Mobile colapsa em lista vertical, sem scroll horizontal; cor sempre pareada com ícone/sinal (AA)
- [ ] Evidência: screenshot da grade cheia/filtrada + teste da derivação "atrasado" no fuso `America/Sao_Paulo`

## Blocked by

- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)

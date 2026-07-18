# Agenda mensal: navegador primário de Lançamentos

## What to build

A **Agenda** — navegador primário de Lançamentos (não existe página de lista/tabela separada). **Grade
mensal de 7 colunas**; cada Lançamento é um **chip compacto** cuja **cor vem do Tipo** e o **estilo do
Status/atrasado** vem da tabela semântica (`docs/ui/mock/design.md`): Receita verde `+`, Despesa
vermelho `−`, Transferência neutra; EFETIVADO sólido, PENDENTE contorno, atrasado com acento
âmbar/vermelho sobre o pendente (nunca um quarto status). Máx. ~3 chips/dia; excedente vira **"+N
mais"**. **Clicar num dia** → detalhe (popover) com os Lançamentos do dia + "Novo Lançamento" com
**data pré-preenchida** (reusa o modal da Slice 05). **Clicar num chip** → mesmo modal em edição.
**Filtros por URL** (`?status=atrasado`, `?conta=…`, `?proximos=1`) para os deep-links dos Alertas
(Slice 08). Mobile: grade **colapsa em lista vertical de dias**, sem scroll horizontal. Cor nunca é
canal único — sempre pareada com ícone/sinal/texto.

## Acceptance criteria

- [ ] Grade mensal 7 colunas no desktop; navegação entre meses
- [ ] Chip por Lançamento com cor/estilo derivados exclusivamente da tabela semântica do design system
- [ ] Máx. ~3 chips/dia visíveis; excedente vira "+N mais" expansível
- [ ] Clicar num dia abre popover com os Lançamentos do dia + CTA "Novo Lançamento" com data pré-preenchida
- [ ] Clicar num chip abre o modal compartilhado (Slice 05) em edição
- [ ] Filtros por querystring (`status`, `conta`, `proximos`) refletem na grade renderizada
- [ ] `< lg`: grade colapsa em lista vertical de dias, sem scroll horizontal até ~360px
- [ ] Evidência: screenshot da grade com chips de todos os estados (Receita/Despesa/Transferência × EFETIVADO/PENDENTE/atrasado)

## Blocked by

- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)

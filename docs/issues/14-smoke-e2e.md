# Smoke E2E: happy path ponta a ponta

## What to build

Um teste **end-to-end** do caminho feliz que amarra as fatias e prova que o app funciona como um todo coerente: registrar → semear Categorias → criar Conta → criar Lançamentos (pontual + recorrente) → ver Saldo Atual e a série de Saldo Projetado no Dashboard → abrir a Agenda e ver os chips → disparar um Alerta (atrasado ou projeção negativa) e clicar para a Agenda filtrada. Roda contra a stack real (SQLite de teste), com OpenAI **mockada** onde a IA participa. Serve de rede de segurança contra regressões entre fatias implementadas por agentes independentes.

## Acceptance criteria

- [ ] Fluxo E2E: registrar → Conta → Lançamento pontual + recorrente → Dashboard (Saldo Atual + série projetada) → Agenda (chips) → Alerta clicável → Agenda filtrada
- [ ] Roda contra SQLite de teste; OpenAI mockada onde aplicável; sem recálculo de saldo no cliente
- [ ] Cores/estilos de Tipo/Status/atrasado conferidos na Agenda (tabela semântica)
- [ ] Verde no CI; evidência: saída do run E2E

## Blocked by

- Slice 03 (contas)
- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)
- Slice 07 (agenda-mensal)
- Slice 08 (dashboard-alertas)

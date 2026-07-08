# Lançamento pontual: CRUD e transição de Status

## What to build

O núcleo: CRUD de **Lançamento** pontual (ver `CONTEXT.md`). Cada Lançamento tem Tipo (Receita/Despesa), valor (centavos), data (date-only), Categoria, Conta e Status (`PENDENTE` | `EFETIVADO`). UI para criar/editar/excluir/listar (com filtros por período, conta, status). Transição `PENDENTE → EFETIVADO` **permite ajustar o valor** para o real; **não há pagamento parcial** (transição total). "Atrasado" é **derivado** (PENDENTE com data passada no fuso `America/Sao_Paulo`), nunca um status persistido.

## Acceptance criteria

- [ ] Criar/editar/excluir Lançamento com todos os campos; valor em centavos
- [ ] Efetivar um PENDENTE permite confirmar/ajustar o valor
- [ ] "Atrasado" calculado (PENDENTE + data < hoje), não armazenado
- [ ] Categoria compatível com o Tipo do Lançamento
- [ ] Lançamentos escopados por `userId`
- [ ] Teste: derivação de atrasado em bordas de dia (fuso); efetivar-com-valor-ajustável
- [ ] Evidência: CRUD + efetivação demonstrados

## Blocked by

- Slice 03 (contas)
- Slice 04 (categorias)

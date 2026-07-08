# Smoke E2E: caminho feliz ponta a ponta

## What to build

Um **único teste de fumaça (smoke) de caminho feliz** que sobe a app e percorre o fluxo essencial no browser: **registrar/login → criar um Lançamento → vê-lo no dashboard com o saldo atualizado**. O objetivo é validar que o executor consegue dirigir um browser e entregar o resultado com **evidência**. O executor escolhe a ferramenta e a monta sozinho; o que é obrigatório é o teste existir, passar, e produzir evidência (screenshot/log). Não expandir para uma suíte de UI — é só o caminho feliz.

## Acceptance criteria

- [ ] Um teste E2E automatizado sobe a app e executa registrar/login → criar Lançamento → conferir no dashboard
- [ ] O teste passa de forma reprodutível
- [ ] Evidência anexada (screenshot e/ou log da execução)
- [ ] Escopo restrito a um caminho feliz (sem suíte ampla de UI)

## Blocked by

- Slice 02 (auth)
- Slice 05 (lancamento-pontual)
- Slice 08 (dashboard-alertas)

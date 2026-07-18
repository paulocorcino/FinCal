# Smoke E2E: fluxo ponta a ponta do FinCal AI

## What to build

Um teste end-to-end (Playwright ou equivalente) que percorre o **caminho crítico** do produto usando um
usuário fresco, provando que as fatias anteriores compõem um app coerente e não cinco frontends soltos:
registro → Conta → Categoria → Lançamento pontual (EFETIVADO e PENDENTE) → Recorrência via toggle
"Repetir" → Transferência → Agenda mostrando os chips certos com a tabela semântica → Dashboard com
Saldo Atual/Projetado e Alertas clicáveis levando à Agenda filtrada → logout. Roda contra a UI real
(sem mocks de camada de serviço), com OpenAI mockada onde o fluxo toca IA. Não substitui os testes de
unidade/integração das fatias — é a evidência de que a **integração** funciona.

## Acceptance criteria

- [ ] Registro cria usuário isolado e semeia Categorias padrão
- [ ] Cria Conta, Categoria, Lançamento pontual EFETIVADO e PENDENTE — Agenda mostra os chips com estilo correto
- [ ] Cria Recorrência pelo toggle "Repetir" no modal; ocorrência aparece na Agenda com `recorrenciaId`
- [ ] Cria Transferência; par aparece neutro na Agenda e não distorce Receita/Despesa no Dashboard
- [ ] Dashboard mostra Saldo Atual/Projetado consistentes com os Lançamentos criados no teste
- [ ] Clicar num Alerta do Dashboard navega para a Agenda já filtrada
- [ ] Logout encerra a sessão e bloqueia acesso às rotas autenticadas
- [ ] Evidência: relatório/saída do runner E2E anexado, rodando contra build local

## Blocked by

- Slice 01 (walking-skeleton)
- Slice 02 (auth)
- Slice 03 (contas)
- Slice 04 (categorias)
- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)
- Slice 07 (agenda-mensal)
- Slice 08 (dashboard-alertas)
- Slice 09 (recorrencia)
- Slice 10 (transferencia)
- Slice 11 (assistente)
- Slice 12 (importacao-assistida)
- Slice 13 (diagnostico-financeiro)

# Assistente: chat que age no sistema com confirmação

## What to build

O **Assistente** conversacional — **painel lateral global (slide-over à direita)** aberto por um botão persistente, disponível sobre qualquer tela (não é destino de nav de topo). Traduz mensagens em chamadas de **tool** (function calling) que são **wrappers finos sobre a mesma camada de serviço da UI** (ADR-0004). Tools rodam sempre no escopo do **`userId` da sessão**, nunca de argumento do modelo. **Leituras** ("quanto tenho hoje?") respondem direto no chat, com números vindos do **motor** (nunca do modelo). **Escritas nunca executam direto**: o Assistente renderiza um **cartão de confirmação inline** (resumo estruturado — Tipo, valor, Conta, Categoria, data, Status) com **Confirmar / Cancelar**; só Confirmar chama `criarLancamento` etc. Quando faltam dados obrigatórios, **pergunta no chat** — nunca inventa Conta ou valor. Após confirmar, Agenda/Dashboard atualizam atrás do painel (re-busca, sem UI otimista). OpenAI **mockada** nos testes.

## Acceptance criteria

- [ ] Slide-over à direita, aberto por botão persistente, sobre qualquer tela; não é destino de nav
- [ ] Leituras respondem no chat com números do **motor**; escritas geram **cartão de confirmação inline** (Confirmar/Cancelar)
- [ ] Só Confirmar chama a camada de serviço; Cancelar descarta; tools sempre no `userId` da sessão (nunca do modelo)
- [ ] Dados obrigatórios faltando → o Assistente **pergunta**, nunca inventa; views atrás do painel re-buscam após confirmar
- [ ] Testes com **OpenAI mockada**: a tool certa é chamada com os argumentos certos; escrita exige confirmação
- [ ] Evidência: teste do fluxo leitura + escrita-com-confirmação (mock) + screenshot do cartão

## Blocked by

- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)

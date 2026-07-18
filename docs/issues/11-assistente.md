# Assistente: chat que age no sistema com confirmação humana

## What to build

O **Assistente** como painel lateral global (slide-over à direita), aberto por um botão persistente na
topbar sobre qualquer tela — não é destino de nav de topo. Traduz mensagens em chamadas de **tool**
(function calling) sobre a **mesma camada de serviço** usada pela UI (`criarLancamento` etc.). Tools
rodam sempre no escopo do `userId` da **sessão**, nunca de argumento gerado pelo modelo (ADR-0004).
**Leituras** ("quanto tenho hoje?") respondem direto no chat, sem cartão. **Escritas** ("lance R$ 200
de mercado") **nunca executam direto**: renderizam um **cartão de confirmação inline** (Tipo, valor,
Conta, Categoria, data, Status) com Confirmar/Cancelar — só Confirmar chama o serviço; Cancelar
descarta. Quando faltam dados obrigatórios, o Assistente **pergunta** no chat, nunca inventa Conta ou
valor. Após confirmar, Agenda/Dashboard atualizam **atrás do painel** (revalidação do servidor, nunca
recálculo client-side).

## Acceptance criteria

- [ ] Painel slide-over abre/fecha por botão persistente na topbar, sobre qualquer tela
- [ ] Pergunta de leitura retorna resposta direta no chat (sem cartão), usando os mesmos motores/serviços da UI
- [ ] Comando de escrita gera cartão de confirmação inline com resumo estruturado; nada é gravado antes de Confirmar
- [ ] Cancelar descarta a proposta sem chamar o serviço
- [ ] Dado obrigatório faltando → Assistente pergunta no chat, nunca preenche Conta/valor arbitrário
- [ ] Tool roda com `userId` da sessão; tentativa de passar `userId` diferente via prompt é ignorada
- [ ] Após confirmar uma escrita, Agenda/Dashboard revalidam do servidor (sem recálculo de saldo no cliente)
- [ ] OpenAI mockada nos testes
- [ ] Evidência: teste de que uma escrita nunca persiste sem confirmação + teste de isolamento de `userId` + screenshot do cartão de confirmação

## Blocked by

- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)

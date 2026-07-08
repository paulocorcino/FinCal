# Assistente: chat agêntico com tool calling

## What to build

**Assistente** (ver `CONTEXT.md` e ADR-0004): chat em linguagem natural que traduz mensagens em **tool calls** (function calling da OpenAI, modelo de `OPENAI_MODEL`) sobre a **mesma camada de serviço** que a UI usa — nada de SQL ou regra de negócio dentro das tools. Tools iniciais: `criarLancamento`, `criarRecorrencia`, `listarLancamentos`, `calcularSaldoProjetado`, `marcarComoEfetivado`. Regras: **leituras executam direto; escritas exigem confirmação explícita** do usuário antes de efetivar; quando faltam dados obrigatórios, o Assistente **pergunta** (nunca inventa Conta ou valor). O `userId` vem **sempre da sessão**, nunca de argumento do modelo. Conversa **efêmera** (sem persistir histórico).

## Acceptance criteria

- [ ] Chat funcional; "mostre minhas despesas recorrentes deste mês" executa leitura e responde
- [ ] "cadastre o aluguel de R$ 2.500 todo dia 10" cria a Recorrência **após confirmação**
- [ ] Dados faltantes (ex.: conta) geram pergunta, não chute
- [ ] Tools são wrappers finos da camada de serviço; `userId` da sessão
- [ ] Testes: OpenAI **mockada** — uma tool-call montada produz o efeito de domínio certo; escrita sem confirmação não efetiva
- [ ] Evidência: transcrição de uma leitura e de uma escrita-com-confirmação

## Blocked by

- Slice 05 (lancamento-pontual)
- Slice 06 (motor-de-saldo)

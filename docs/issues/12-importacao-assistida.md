# Importação Assistida de extratos/faturas

## What to build

**Importação Assistida** (ver `CONTEXT.md` e ADR-0004): upload de extrato/fatura em **PDF com texto, CSV ou OFX** (sem OCR). O servidor extrai o texto e usa a OpenAI com **structured outputs** para produzir um array de **Lançamentos Candidatos** (data, valor, descrição, tipo, categoria sugerida). Os candidatos aparecem numa **tabela de revisão**; o usuário edita, escolhe conta/categoria, descarta e **confirma**. A **Conta de destino é escolhida no upload**. Candidatos entram como `EFETIVADO` por padrão. Só na confirmação viram Lançamentos — chamando a **mesma `criarLancamento`** da camada de serviço. Duplicados (mesma Conta+data+valor de um Lançamento existente) são **sinalizados** visualmente, nunca removidos automaticamente.

## Acceptance criteria

- [ ] Upload de PDF-texto/CSV/OFX; texto extraído server-side
- [ ] IA retorna candidatos via structured outputs (schema JSON)
- [ ] Tabela de revisão editável; Conta escolhida no upload; candidatos `EFETIVADO` por padrão
- [ ] Confirmar cria Lançamentos via `criarLancamento` (nada gravado antes)
- [ ] Duplicados sinalizados (mesma Conta+data+valor), decisão do usuário
- [ ] Testes: parser de structured output com payload fixo (OpenAI mockada); heurística de duplicado
- [ ] Evidência: fluxo upload → revisão → confirmação demonstrado

## Blocked by

- Slice 05 (lancamento-pontual)

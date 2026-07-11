# Importação Assistida: extrair candidatos e revisar

## What to build

Fluxo em dois passos. **Passo 1 — Upload:** **Conta de destino obrigatória** (a IA não adivinha) + arquivo (**PDF com texto / CSV / OFX — sem OCR**). A IA extrai **Lançamentos Candidatos** via **structured outputs** — nunca há gravação automática. **Passo 2 — Tabela de revisão** (uma linha por candidato, Conta destino como contexto fixo no topo): **edição inline** (data, valor, Categoria, Tipo, descrição) com os primitivos compartilhados; **checkbox incluir/excluir** por linha (default incluído — excluir é desmarcar, nunca delete destrutivo); **duplicados** (mesma Conta+data+valor) recebem **badge âmbar + tooltip** e **seguem incluídos** (sinalizados, nunca removidos automaticamente); default **`EFETIVADO`** (históricos), editável. **"Confirmar N Lançamentos"** em lote chama a mesma `criarLancamento` por linha marcada → toast + refresh. Candidato só vira Lançamento na confirmação. OpenAI **mockada** nos testes.

## Acceptance criteria

- [ ] Upload exige Conta de destino + arquivo (PDF-texto/CSV/OFX, sem OCR); IA extrai Candidatos via structured outputs, sem gravar
- [ ] Tabela de revisão com edição inline (primitivos compartilhados) e checkbox incluir/excluir (default incluído, excluir = desmarcar)
- [ ] Duplicados (mesma Conta+data+valor) sinalizados com badge âmbar + tooltip, **seguem incluídos**
- [ ] Default `EFETIVADO`, editável; "Confirmar N Lançamentos" chama `criarLancamento` por linha marcada → toast + refresh
- [ ] Candidato só vira Lançamento na confirmação; queries filtram por `userId`
- [ ] Evidência: teste com **OpenAI mockada** (extração → candidatos → confirmação em lote) + detecção de duplicado + screenshot

## Blocked by

- Slice 05 (lancamento-pontual)

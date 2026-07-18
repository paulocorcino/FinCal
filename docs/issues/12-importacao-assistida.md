# Importação Assistida: extrato/fatura → revisão humana → Lançamentos

## What to build

Fluxo de duas etapas. **Passo 1 — Upload:** o usuário escolhe a **Conta de destino obrigatória** (a IA
não adivinha) e sobe um arquivo (PDF-texto, CSV ou OFX — **sem OCR** no MVP); a Conta escolhida vira
contexto fixo no topo da revisão. **Passo 2 — Tabela de revisão:** a IA extrai **Lançamentos
Candidatos** via structured outputs (efêmeros — nunca persistidos antes da confirmação, IMP-01), uma
linha por candidato, com **edição inline** (data, valor, Categoria, Tipo, descrição) usando os
primitivos da Slice 05. **Checkbox incluir/excluir** por linha (default incluído; excluir = desmarcar,
nunca delete destrutivo). **Duplicados** (mesma Conta+data+valor) recebem **badge âmbar + tooltip** e
seguem incluídos por default — apenas sinalizados, nunca removidos automaticamente. Candidatos entram
como `EFETIVADO` por padrão (são históricos), editável. **"Confirmar N Lançamentos"** em lote chama a
mesma `criarLancamento` por linha marcada, com toast e refresh.

## Acceptance criteria

- [ ] Upload exige Conta de destino antes de aceitar o arquivo; aceita PDF-texto/CSV/OFX, rejeita outros formatos com mensagem clara
- [ ] IA extrai candidatos via structured outputs; nada é persistido nesta etapa (recarregar a página perde o progresso — aceito, IMP-01)
- [ ] Tabela de revisão com edição inline (data, valor, Categoria, Tipo, descrição) por linha
- [ ] Checkbox incluir/excluir por linha, default incluído
- [ ] Duplicados (mesma Conta+data+valor de Lançamento já existente) marcados com badge âmbar, seguem incluídos por default
- [ ] Default de Status = `EFETIVADO`, editável por linha
- [ ] "Confirmar N Lançamentos" cria um Lançamento por linha marcada via `criarLancamento`, com toast de resultado e refresh das views derivadas
- [ ] OpenAI mockada nos testes de extração
- [ ] Evidência: teste de detecção de duplicados + teste de que confirmar N linhas cria exatamente N Lançamentos + screenshot da tabela de revisão

## Blocked by

- Slice 05 (lancamento-pontual)

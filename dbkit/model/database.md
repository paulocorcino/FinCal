# FinCal AI — Domain, vocabulary and business rules

> Canonical dialect: sqlite.
> Tables: `dbkit/schema/tables/` · Diagram: `dbkit/model/erd.mmd` · Routines: `dbkit/schema/native/sqlite/`.

## The business

Agenda financeira inteligente: o usuário registra Receitas e Despesas (pontuais ou recorrentes),
visualiza-as num calendário mensal, e o foco do produto é **previsibilidade** — o Saldo Projetado
como série diária. Vocabulário completo em [`CONTEXT.md`](../../CONTEXT.md); decisões de produto
em `docs/adr/`.

## Vocabulary (ubiquitous language)

Ver [`CONTEXT.md`](../../CONTEXT.md) — não duplicado aqui; este arquivo referencia o termo e aponta
a tabela que o materializa.

## Core business rules

- **CAT-01 — Collation de texto**: `User.email` e colunas de chave natural (ex.: `Categoria.nome`)
  usam `COLLATE NOCASE` para deduplicar variação de maiúscula/minúscula ASCII (não normaliza acento)
  → aplicado na definição da coluna em `schema/tables/`.
- **CAT-02 — Isolamento por usuário**: toda tabela de domínio carrega `userId`; toda query de
  aplicação filtra por ele (ADR-0004) → FK `userId → user.id` em cada tabela, sem exceção.
- **CAT-03 — Estratégia de chave primária**: toda PK é `TEXT` gerado por `cuid()` na aplicação
  (Prisma `@default(cuid())`), nunca `INTEGER AUTOINCREMENT` — evita IDs sequenciais adivinháveis
  numa fronteira de isolamento por `userId` (IDOR) → convenção aplicada em todo `CREATE TABLE`
  de `schema/tables/`.
- **CAT-04 — Chave natural de Categoria**: `Categoria` é única por `(userId, tipo, nome COLLATE
  NOCASE)` — impede duplicar "Mercado" dentro do mesmo Tipo, mas permite reusar o nome entre
  Receita/Despesa → `UNIQUE` composto em `categoria`. `Conta` não tem restrição de nome (é
  plausível repetir rótulo entre bancos, ex. dois "Cartão").
- **CAT-05 — Exclusão de Conta/Categoria/Recorrência em uso**: `Conta` e `Categoria` usam
  `ON DELETE RESTRICT` quando há Lançamentos vinculados (bloqueia com erro; usuário reatribui ou
  apaga os Lançamentos antes) — nenhuma das duas tem um "vazio" natural para o Lançamento cair.
  `Recorrencia` usa `ON DELETE SET NULL` em `lancamento.recorrenciaId` — apagar a regra desliga as
  ocorrências já materializadas, que viram Lançamentos pontuais comuns, preservando o histórico.
- **LAN-01 — Categoria em leg de Transferência**: `lancamento.categoriaId` é `NULL` quando
  `transferenciaId` não é nulo (a Transferência já se identifica pelo par `transferenciaId`, não
  precisa de Categoria); em Lançamento comum, `categoriaId` é obrigatório.
- **REC-01 — Frequências suportadas (MVP)**: `recorrencia.frequencia` é um enum com apenas
  `MENSAL` e `SEMANAL` (ANUAL/QUINZENAL fora do MVP, extensível depois só adicionando ao enum).
  Campo único `recorrencia.dia` (`INTEGER`), reinterpretado pela frequência: 1–31 para `MENSAL`
  (regra de "dia >28 em mês curto" é do motor de recorrência, não do schema), 0–6 (dom–sáb) para
  `SEMANAL`.
- **REC-02 — Materialização idempotente**: `UNIQUE(recorrenciaId, data)` em `lancamento` (onde
  `recorrenciaId` não é nulo) — rodar a materialização lazy duas vezes para a mesma data não
  duplica a ocorrência (ADR-0003).
- **TRA-01 — Sem tabela própria**: Transferência não é uma entidade em `schema/tables/` — é um
  par de linhas em `lancamento` (saída na Conta origem tipo Despesa, entrada na Conta destino tipo
  Receita) compartilhando `transferenciaId` (opaco, sem FK para lugar nenhum, só agrupador).
- **TRA-02 — Integridade do par é responsabilidade da aplicação**: SQLite não expressa
  declarativamente "existem exatamente 2 linhas com este `transferenciaId`, Contas diferentes,
  mesmo valor e data". A invariante é garantida pela camada de serviço (caminho único de escrita,
  ADR-0004: `criarTransferencia` cria/edita/apaga as duas pernas atomicamente), não por constraint
  de banco — risco assumido, documentado aqui para não ser "descoberto" depois como lacuna.
- **IMP-01 — Lançamento Candidato sem tabela**: candidatos da Importação Assistida são efêmeros
  (resposta da API + estado de UI entre upload e confirmação); nunca persistidos antes de
  `criarLancamento` confirmar. Recarregar a página no meio da revisão perde o progresso — aceito
  para o MVP.
- **REN-01 — Histórico por vigência**: `renda_liquida` é append-only (`valor` + `vigenteDesde`,
  `UNIQUE(userId, vigenteDesde)`); "valor atual" é a linha de maior `vigenteDesde` ≤ hoje. Sem
  data de fim — o fim de uma vigência é implícito pelo início da próxima.

## Tables

### Identidade

#### user

- **Concept:** um usuário autenticado (Auth.js, e-mail + senha) — o limite de isolamento de todo
  o resto do modelo.
- **Invariants:** `email` único, `COLLATE NOCASE` (CAT-01).
- **Relations:** raiz de todas as tabelas de domínio via `userId` (CAT-02); nenhuma delas existe
  sem um `user`.

### Contas e Categorias

#### conta

- **Concept:** onde o dinheiro reside — guarda só o Saldo Inicial (âncora); nunca um saldo
  materializado (ADR-0002).
- **Invariants:** `papel` ∈ {`CORRENTE`, `RESERVA`, `INVESTIMENTO`, `CARTAO`}; sem unicidade de
  `nome` (CAT-04); `saldoInicialCentavos` é inteiro (dinheiro sempre em centavos, nunca float).
- **Relations:** 1 `user` → N `conta`. `conta` → N `lancamento` (`ON DELETE RESTRICT`, CAT-05) e
  N `recorrencia` (`ON DELETE RESTRICT`, mesma razão: nenhum "vazio" natural para a regra cair).

#### categoria

- **Concept:** rótulo de classificação de um Lançamento, com um Tipo associado; plana, sem
  subcategorias; pré-semeada no registro do usuário (Slice 02) e depois editável por ele.
- **Invariants:** `tipo` ∈ {`RECEITA`, `DESPESA`}; `UNIQUE(userId, tipo, nome COLLATE NOCASE)`
  (CAT-04).
- **Relations:** 1 `user` → N `categoria`. `categoria` → N `lancamento` (`ON DELETE RESTRICT`,
  CAT-05) e N `recorrencia` (`ON DELETE RESTRICT`).

### Lançamentos

#### lancamento

- **Concept:** unidade central do domínio — um evento financeiro único (Receita ou Despesa),
  pontual ou materializado de uma Recorrência; também a perna de uma Transferência.
- **Invariants:** `tipo` ∈ {`RECEITA`, `DESPESA`}; `status` ∈ {`PENDENTE`, `EFETIVADO`}; "atrasado"
  nunca é uma coluna, é derivado em runtime (`PENDENTE` + `data` < hoje); `valorCentavos` inteiro;
  `data` é `TEXT` ISO `YYYY-MM-DD`, date-only, sem componente de hora/fuso (ancorado a
  `America/Sao_Paulo` na camada de aplicação); `categoriaId` nulo apenas em perna de Transferência
  (LAN-01); `UNIQUE(recorrenciaId, data)` quando `recorrenciaId` não é nulo (REC-02); sem
  pagamento parcial — `efetivar` sobrescreve `valorCentavos` in place, sem guardar o valor
  previsto original (não há tabela/coluna de histórico de estimativa).
- **Relations:** N `lancamento` → 1 `conta` (`RESTRICT`), N `lancamento` → 0..1 `categoria`
  (`RESTRICT`, nulo em Transferência), N `lancamento` → 0..1 `recorrencia` (`SET NULL`, CAT-05).
  `transferenciaId` (nullable, `TEXT`) não é FK — só agrupa o par (TRA-01/TRA-02).

### Recorrência

#### recorrencia

- **Concept:** a regra (tipo, valor, categoria, conta, frequência, dia, início, fim opcional) que
  materializa Lançamentos concretos de forma preguiçosa, sem cron (ADR-0003).
- **Invariants:** `frequencia` ∈ {`MENSAL`, `SEMANAL`} (REC-01); `dia` reinterpretado pela
  frequência (REC-01); `dataFim` opcional; nunca edita Lançamentos já materializados retroativamente.
- **Relations:** N `recorrencia` → 1 `conta` (`RESTRICT`), N `recorrencia` → 1 `categoria`
  (`RESTRICT`). 1 `recorrencia` → N `lancamento` (as ocorrências materializadas, `SET NULL` ao
  apagar a regra).

### Renda Líquida

#### renda_liquida

- **Concept:** renda líquida mensal declarada pelo usuário, com vigência — a régua que ancora as
  metas do Diagnóstico, deliberadamente independente das Receitas realizadas.
- **Invariants:** append-only, `UNIQUE(userId, vigenteDesde)` (REN-01); "valor atual" = maior
  `vigenteDesde` ≤ hoje, calculado em runtime, não uma flag `atual` persistida.
- **Relations:** 1 `user` → N `renda_liquida`.

## Routines (N3 — `dbkit/schema/native/sqlite/`)

| Routine | Type | Rule it implements |
|---|---|---|

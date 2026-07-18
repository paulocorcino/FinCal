# PRD — FinCal AI (MVP)

> Documento local (fonte da verdade), companheiro do [`CONTEXT.md`](../../CONTEXT.md) (domínio),
> do [`docs/ui/mock/design.md`](../ui/mock/design.md) (contrato de UI/UX e design system) e dos
> [`docs/adr/`](../adr/) (decisões).
> Este PRD descreve o **produto por inteiro**; as fatias (tracer bullets) que o implementam vivem
> como `NN-*.md` neste mesmo diretório e são publicadas via `scripts/publish-issues.*`.
> Vocabulário de domínio (Lançamento, Conta, Papel, Status, Recorrência, Transferência, Saldo Projetado…)
> é usado aqui na íntegra — sem sinônimos.

## Problem Statement

Quem organiza a própria vida financeira em planilhas ou apps de "conta a pagar" consegue registrar o que
já aconteceu, mas **não enxerga o futuro**: não sabe com clareza quanto vai sobrar no fim do mês, nem em
que dia o saldo cruza abaixo de zero se todos os compromissos previstos se concretizarem. Lançar despesas
recorrentes é repetitivo, importar um extrato é manual e propenso a erro, e classificar tudo tira o ânimo
de manter o registro em dia. O usuário quer **previsibilidade** e **baixo atrito**, não mais uma planilha.

## Solution

O **FinCal AI** é uma agenda financeira cujo foco é **previsibilidade**. O usuário registra **Lançamentos**
(Receitas e Despesas, pontuais ou recorrentes) em **Contas**, e o produto deriva — nunca materializa — o
**Saldo Atual** e uma **série diária de Saldo Projetado** ao longo de um horizonte, destacando o primeiro
dia em que o saldo fica negativo. Uma **Agenda** mensal mostra os Lançamentos como um calendário; um
**Dashboard** resume saldo, projeção e **Alertas** (atrasados, próximos, projeção negativa) calculados na
hora. **Recorrências** materializam Lançamentos de forma preguiçosa, sem cron. Um **Assistente** em
linguagem natural executa ações no sistema (com confirmação humana em escritas), a **Importação Assistida**
extrai Lançamentos Candidatos de extratos para revisão, e um **Diagnóstico Financeiro** narra recomendações
sobre métricas determinísticas. Toda a lógica financeira é **função pura testável**; a IA **traduz e narra**,
nunca é fonte de número (ADR-0004).

## User Stories

### Autenticação e primeiro contato
1. Como visitante, quero me registrar com e-mail e senha, para ter um espaço isolado dos meus dados.
2. Como visitante, quero alternar entre login e registro no mesmo card centralizado, para não me perder.
3. Como usuário, quero ver erros de autenticação inline no formulário, para corrigir sem adivinhar.
4. Como usuário recém-registrado, quero que **Categorias padrão** já venham semeadas, para não começar do zero.
5. Como usuário novo, quero que meu único vazio bloqueante seja "não ter Conta", para não enfrentar um wizard.
6. Como usuário, quero fazer logout pelo menu de usuário no rodapé da sidebar, para encerrar minha sessão.

### Contas
7. Como usuário, quero criar uma **Conta** com nome, **Papel** (`CORRENTE`/`RESERVA`/`INVESTIMENTO`/`CARTAO`) e **Saldo Inicial**, para ancorar meus saldos.
8. Como usuário, quero editar e excluir Contas (com `AlertDialog` de confirmação), para manter a lista limpa.
9. Como usuário, quero ver o **Saldo Atual derivado** de cada Conta, sem que a Conta guarde saldo materializado (ADR-0002).
10. Como usuário, quero que o Papel `CARTAO` seja uma Conta genérica (saldo pode ficar negativo, sem lógica de fatura), para simplicidade.

### Categorias
11. Como usuário, quero criar/editar/excluir **Categorias**, cada uma com um **Tipo** (Receita ou Despesa), para classificar Lançamentos.
12. Como usuário, quero que Categorias sejam planas (sem subcategorias) e com cor/ícone cosméticos, para não me perder em hierarquia.

### Lançamentos pontuais
13. Como usuário, quero criar um **Lançamento** (Tipo, valor, Conta, Categoria, data, Status) via um **modal compartilhado**, para registrar rápido.
14. Como usuário, quero que o **Status padrão derive da data** (passado → `EFETIVADO`; hoje/futuro → `PENDENTE`), editável, para menos cliques.
15. Como usuário, quero digitar valores com máscara `R$ 1.234,56`, sabendo que internamente vira **centavos inteiros**, para nunca ter erro de float.
16. Como usuário, quero escolher datas em `dd/MM/yyyy` (date-only, fuso `America/Sao_Paulo`), para evitar deslize de fuso.
17. Como usuário, quero editar e excluir Lançamentos (com confirmação em delete), para corrigir registros.
18. Como usuário, quero **efetivar** um Lançamento `PENDENTE` ajustando o valor previsto para o real, para refletir o que de fato aconteceu.
19. Como usuário, quero que cada escrita gere um **toast** de sucesso/erro, para ter feedback imediato.

### Motor de saldo e projeção
20. Como usuário, quero ver meu **Saldo Atual** (= Saldo Inicial + Σ EFETIVADOS até hoje), para saber o dinheiro real.
21. Como usuário, quero ver o **Saldo Projetado** como **série diária** até o fim do mês, para antecipar o futuro.
22. Como usuário, quero que a projeção seja **consolidada** por padrão e **filtrável por Conta**, para focar quando preciso.
23. Como usuário, quero que o horizonte seja configurável (padrão fim do mês), para projetar mais longe quando quiser.
24. Como usuário, quero que o sistema identifique o **1º dia em que o saldo cruza abaixo de zero**, para agir antes.

### Agenda
25. Como usuário, quero uma **grade mensal de 7 colunas** com meus Lançamentos como **chips**, para ler o mês de relance.
26. Como usuário, quero que a cor do chip venha do **Tipo** e o estilo do **Status/atrasado** (tabela semântica), para distinguir sem ler.
27. Como usuário, quero ver no máximo ~3 chips por dia com um "+N mais" para o excedente, para a grade não virar sopa.
28. Como usuário, quero **clicar num dia** e ver um detalhe (popover) com os Lançamentos e um "Novo Lançamento" com **data pré-preenchida**, para lançar em contexto.
29. Como usuário, quero **clicar num chip** e abrir o mesmo modal em **edição**, para ajustar sem trocar de tela.
30. Como usuário, quero que os deep-links de Alertas abram a **Agenda já filtrada** por URL (`?status=atrasado`, `?conta=…`, `?proximos=1`).
31. Como usuário no celular, quero que a grade **colapse numa lista vertical de dias**, sem scroll horizontal.

### Dashboard e Alertas
32. Como usuário, quero uma landing com **cards de Saldo Atual e Saldo Projetado (fim do mês)**, coloridos pela tabela semântica.
33. Como usuário, quero um **gráfico de linha** da projeção diária destacando o 1º dia negativo, para visualizar o risco.
34. Como usuário, quero um **painel de Alertas** — atrasados, vencimentos próximos (N dias), projeção negativa — calculados na hora.
35. Como usuário, quero que **cada Alerta seja clicável** e me leve à Agenda filtrada, para agir sem procurar.
36. Como usuário, quero configurar o **N dias** do alerta de vencimento próximo (default 7) no menu de usuário.
37. Como usuário sem Contas, quero um **EmptyState** com CTA "Criar sua primeira Conta" no lugar de um dashboard vazio.

### Recorrência
38. Como usuário, quero criar uma **Recorrência** (tipo, valor, categoria, conta, frequência, dia, início, fim opcional) por um toggle **"Repetir"** dentro do mesmo modal de Lançamento (desligado por padrão), sem um fluxo separado, para não repetir lançamentos fixos.
39. Como usuário, quero que as ocorrências se **materializem preguiçosamente** ao navegar/projetar, cada uma um Lançamento com `recorrenciaId` (ADR-0003).
40. Como usuário, quero que editar/excluir uma ocorrência dispare um **diálogo de escopo** — "Só esta" vs "Esta e as futuras", para controlar o alcance.
41. Como usuário, quero que "Só esta" marque a ocorrência como modificada (imune à regeneração) e "Esta e as futuras" altere a regra sem edição retroativa.
42. Como usuário, quero que Lançamentos sem `recorrenciaId` **não** mostrem o diálogo de escopo, para não confundir.

### Transferência
43. Como usuário, quero uma ação separada **"Nova Transferência"** (origem, destino, valor, data) que cria o **par vinculado** (`transferenciaId`).
44. Como usuário, quero que a Transferência seja **neutra** (cinza/azul), nunca contando como Receita nem Despesa, para não distorcer meus totais.
45. Como usuário, quero que a Transferência nunca seja montada como Despesa+Receita à mão nem dentro do modal de Lançamento comum.
46. Como usuário, quero **clicar numa perna de Transferência** na Agenda e reabrir o mesmo formulário "Nova Transferência" pré-preenchido em edição, para corrigir valor/data/contas sem apagar e recriar.
47. Como usuário, quero que **excluir** uma Transferência sempre remova o **par inteiro**, nunca uma perna isolada.

### Assistente
48. Como usuário, quero abrir um **painel lateral (slide-over à direita)** por um botão persistente, sobre qualquer tela, para conversar.
49. Como usuário, quero fazer **perguntas de leitura** ("quanto tenho hoje?") e receber a resposta direto no chat, sem cartão.
50. Como usuário, quero que **escritas** ("lance R$ 200 de mercado") gerem um **cartão de confirmação inline** (resumo estruturado) com Confirmar/Cancelar.
51. Como usuário, quero que só **Confirmar** chame a mesma camada de serviço da UI (`criarLancamento` etc.), e Cancelar descarte.
52. Como usuário, quero que o Assistente **pergunte** quando faltam dados obrigatórios, nunca inventando Conta ou valor.
53. Como usuário, quero ver a Agenda/Dashboard **atualizarem atrás do painel** após confirmar, para sentir que o Assistente age no sistema.
54. Como usuário, quero que toda tool rode no escopo do **meu `userId` de sessão**, nunca de argumento do modelo (ADR-0004).

### Importação Assistida
55. Como usuário, quero **subir um extrato/fatura** (PDF-texto, CSV ou OFX; sem OCR) escolhendo a **Conta de destino obrigatória**, para a IA não adivinhar.
56. Como usuário, quero que a IA extraia **Lançamentos Candidatos** via structured outputs, para não digitar linha a linha.
57. Como usuário, quero uma **tabela de revisão** com edição inline (data, valor, Categoria, Tipo, descrição), para corrigir antes de gravar.
58. Como usuário, quero um **checkbox incluir/excluir** por linha (default incluído), onde excluir é desmarcar, nunca delete destrutivo.
59. Como usuário, quero que **duplicados** (mesma Conta+data+valor) sejam **sinalizados** (badge âmbar + tooltip) e sigam incluídos, nunca removidos automaticamente.
60. Como usuário, quero que candidatos entrem como `EFETIVADO` por padrão (são históricos), editável.
61. Como usuário, quero **"Confirmar N Lançamentos"** em lote, chamando `criarLancamento` por linha marcada, com toast e refresh.

### Diagnóstico Financeiro (stretch)
62. Como usuário, quero informar minha **Renda Líquida** com vigência (valor + "vigente desde") no menu de usuário, formando um histórico.
63. Como usuário sem Renda Líquida informada, quero um **EmptyState** "Informe sua Renda Líquida", nunca uma tela meio-quebrada.
64. Como usuário, quero **cards de métrica determinística** — Taxa de Poupança, Reserva atual × meta (barra de progresso), sobra — vindos do motor.
65. Como usuário, quero um **painel de narração da IA** que **referencia** esses números, nunca produzindo números novos.
66. Como usuário, quero um **disclaimer educacional** fixo e sempre visível, para entender que não é aconselhamento profissional.
67. Como usuário, quero que a Reserva de Emergência (meta) seja `6 × gasto mensal médio` (média das Despesas EFETIVADAS dos últimos 3 meses), comparada com a **Reserva atual**.

### Transversais (todas as telas)
68. Como usuário, quero uma **sidebar persistente** com seis destinos (Dashboard, Agenda, Contas, Categorias, Importação, Diagnóstico) na ordem definida — sem itens soltos tipo "Lançamentos"/"Relatórios".
69. Como usuário, quero uma **topbar** com "＋ Novo Lançamento" e o botão do Assistente iguais em toda tela.
70. Como usuário, quero que a UI **nunca recalcule saldo no cliente**: após cada mutação ela revalida/re-busca as views do servidor (corolário do ADR-0002).
71. Como usuário, quero **skeletons** no loading, não spinners de tela cheia.
72. Como usuário, quero um **EmptyState** padronizado (ícone + 1 linha + 1 CTA) em toda tela sem dados.
73. Como usuário de acessibilidade, quero que **cor nunca seja o único canal**: Tipo/Status/atrasado sempre pareiam cor + ícone/sinal/texto.
74. Como usuário no celular, quero que a sidebar colapse em drawer e nada gere scroll horizontal até ~360px (desktop-first, ADR-0005).

## Implementation Decisions

**Stack** (convenções globais): Next.js (App Router) + Prisma + **SQLite em disco persistente** (ADR-0001) +
Auth.js; TypeScript ponta a ponta; UI com Tailwind + shadcn/ui; gráficos só com **shadcn Charts (Recharts)**;
testes em Vitest. Deploy como container tradicional com volume, não serverless (ADR-0001). Segredos em `.env`
(nunca commitado); novas variáveis só como placeholder no `.env.example`.

Módulos a construir/modificar, priorizando **módulos profundos** (interface simples, muita lógica encapsulada,
testável isoladamente):

- **Motor de Saldo** (profundo, coração do produto — ADR-0002). Funções **puras** sobre `Lançamentos[] + saldoInicial`:
  `saldoAtual(contas, lançamentos, hoje)` e `serieSaldoProjetado(contas, lançamentos, horizonte) → { data, valor }[]`,
  mais um derivador do **1º dia negativo**. Consolidado por padrão, parametrizável por Conta. Sem I/O, sem LLM, sem estado.
- **Motor de Recorrência** (profundo — ADR-0003). `materializarAte(regra, dataAlvo, ocorrênciasExistentes) → Lançamentos[]`
  (lazy, idempotente, sem cron) e `aplicarEdicaoDeEscopo(regra, ocorrência, escopo)` para "só esta" vs "esta e as futuras".
  Marca ocorrências modificadas como imunes à regeneração; nunca edita retroativamente.
- **Motor de Sinais Derivados** (profundo). Puro sobre Lançamentos: **Alertas** (atrasados = PENDENTE com data < hoje;
  próximos = PENDENTE nos próximos N dias; projeção negativa = existe dia da série < 0) e **métricas do Diagnóstico**
  (Taxa de Poupança = sobra ÷ Renda Líquida; Reserva atual = Σ CORRENTE+RESERVA; meta = 6 × gasto mensal médio dos
  últimos 3 meses de Despesas EFETIVADAS, excluindo Transferências). "Atrasado" é sempre derivado, nunca persistido.
- **Camada de Serviço de domínio** (profundo, **caminho único de escrita**). `criarLancamento`, `editarLancamento`,
  `excluirLancamento`, `efetivarLancamento`, `criarTransferencia` (par vinculado), CRUD de Conta/Categoria/Recorrência,
  `definirRendaLiquida`. **Toda query filtra por `userId`**; em contexto de IA o `userId` vem da **sessão**, nunca de
  argumento do modelo (ADR-0004). É a mesma camada chamada pela UI, pelas tools do Assistente e pela confirmação da Importação.
- **Utilitários de borda** (profundos e minúsculos): conversão **dinheiro ↔ centavos inteiros** (nunca float) e
  **datas date-only ancoradas em `America/Sao_Paulo`** (proibido `new Date()` ingênuo). Consumidos por UI e motores.
- **Camada de IA** (deliberadamente **rasa** — ADR-0004): tools do Assistente como wrappers finos sobre a Camada de
  Serviço (function calling); extrator da Importação (structured outputs → Lançamentos Candidatos, sem gravar);
  narrador do Diagnóstico (recebe números do motor, só narra). OpenAI **mockada** nos testes; `OPENAI_API_KEY`/`OPENAI_MODEL` no `.env`.
- **Persistência (Prisma/SQLite)**: entidades `Conta` (com `papel`, `saldoInicial`), `Categoria` (com `tipo`),
  `Lançamento` (`tipo`, `status`, `contaId`, `categoriaId`, `data`, `valorCentavos`, `recorrenciaId?`, `transferenciaId?`),
  `Recorrencia`, `RendaLiquida` (valor + vigência), todas com `userId`. A Conta **não** guarda saldo (ADR-0002).
- **Casca de UI + primitivos compartilhados** (design system `docs/ui/mock/design.md`): sidebar persistente/drawer,
  topbar, `<CurrencyInput>`, `<DateField>`, `<EmptyState>`, **modal de Lançamento compartilhado** (com toggle
  **"Repetir"** inline para criar Recorrência — sem fluxo separado), tabela semântica (cores de Tipo/Status/atrasado
  — Despesa e saldo negativo usam o token `error`, não uma cor inventada à parte), casca do Assistente (slide-over),
  diálogo de escopo de recorrência, formulário "Nova Transferência" reaberto em edição ao clicar numa perna na Agenda
  (edita/exclui sempre o par), AlertDialogs de exclusão e de descarte de formulário sujo (dirty-form guard).
  Tokens de cor/tipografia/forma vêm do frontmatter de `docs/ui/mock/design.md`; o mock `code.html`/`screen.png`
  é só evidência de linguagem visual — seu item de nav "Lançamentos"/"Relatórios" e o bubble flutuante de IA
  **não** seguem, pois contradizem a IA (arquitetura de informação) resolvida acima.
- **Auth** (Auth.js): login/registro e-mail+senha; signup semeia Categorias padrão.

Contratos e regras cravadas: dinheiro sempre **centavos inteiros** (formatação só na UI); datas **date-only** em
`America/Sao_Paulo`; **saldo sempre derivado**, UI **nunca recalcula no cliente** (revalida/re-busca após mutação);
**IA nunca produz número** e escritas passam por **confirmação/revisão humana**; **recorrência lazy** sem cron;
form factor **desktop-first**, mobile apenas "não quebra" (ADR-0005). Vocabulário do `CONTEXT.md` na íntegra.

## Testing Decisions

Um bom teste verifica **comportamento externo observável**, não detalhe de implementação: dado um conjunto de
Lançamentos e uma data, o motor produz o saldo/série/alerta esperado — sem espiar estruturas internas nem mockar
o que é lógica pura. Testes em **Vitest**; a OpenAI é **sempre mockada** (a IA nunca entra no caminho de um número).

Módulos que recebem testes (candidatos naturais por serem profundos e puros):

- **Motor de Saldo** — casos de borda: mês de 31 dias; saldo cruzando zero (identifica o 1º dia negativo);
  Lançamento exatamente no limite do horizonte; sem Lançamentos; consolidado vs. filtrado por Conta; PENDENTE
  entra só no projetado, EFETIVADO no atual.
- **Motor de Recorrência** — materialização idempotente (rodar duas vezes não duplica); "só esta" preserva a
  ocorrência modificada ao regenerar; "esta e as futuras" altera futuras não-modificadas sem tocar passado;
  regra com data de fim; ocorrência no limite do horizonte.
- **Motor de Sinais Derivados** — atrasado = PENDENTE vencido (na virada do dia, fuso `America/Sao_Paulo`);
  próximos respeita N dias; projeção negativa detecta qualquer dia < 0; Taxa de Poupança e meta de Reserva
  (fallback com < 3 meses de histórico; Transferências excluídas do gasto médio).
- **Camada de Serviço** — **isolamento**: uma operação nunca enxerga/afeta dados de outro `userId`; Transferência
  cria o par vinculado neutro; `efetivar` ajusta o valor; delete exige o registro do próprio usuário.
- **Utilitários de borda** — dinheiro↔centavos (arredondamento, sinal); datas date-only não deslizam por fuso.

Fora de teste automatizado no MVP: aparência pixel-a-pixel da UI e a qualidade do texto gerado pela IA (o que se
testa é que a IA **chama a tool certa** / **narra os números do motor**, não a prosa). Prior art: as fatias
`NN-*.md` deste diretório carregam critérios de aceite com casos de borda; cada fatia exige **evidência** (saída de
teste / screenshot) na Definition of Done.

## Out of Scope

Dark mode; i18n/multi-locale (só pt-BR, fuso único `America/Sao_Paulo`); arquitetura de informação mobile dedicada
(mobile apenas "não quebra" — ADR-0005); push/e-mail (Alerta é sempre in-app derivado); PWA/offline; UI otimista que
replique o cálculo de saldo no cliente; OCR na Importação (só PDF-texto/CSV/OFX); lógica de fatura/ciclo de cartão
(`CARTAO` é Conta genérica); pagamento parcial (PENDENTE→EFETIVADO é total); rastreamento de investimentos para a
Taxa de Poupança; múltiplos usuários por espaço / compartilhamento; Postgres (SQLite via Prisma, migração adiada — ADR-0001).

## Further Notes

- O **Diagnóstico Financeiro** é stretch goal, construído por último; não bloqueia o MVP demonstrável.
- Este PRD é a visão do produto; a implementação é feita **fatia a fatia** (tracer bullets `NN-*.md`), cada fatia
  cortando schema → API → UI → testes e demonstrável sozinha. Rode `/to-issues` sobre este PRD para (re)gerar as fatias.
- Publicação de fatias ao GitHub é **destrutiva por design** (reseta o board a cada rodada) — ver
  [`docs/issues/README.md`](README.md). Este arquivo, sem prefixo `NN-`, **não** é publicado pelo script.

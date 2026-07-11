# Contrato de UI/UX — FinCal AI

> Companheiro do [`CONTEXT.md`](../CONTEXT.md) (domínio) e das convenções globais em
> [`docs/issues/README.md`](issues/README.md). Todo agente que construir **qualquer tela**
> obedece este contrato, para que fatias implementadas independentemente formem **um app coerente**
> — mesma casca, mesma navegação, mesmos padrões de interação — e não cinco frontends avulsos.
>
> Regras aqui são de **implementação/apresentação**; termos de domínio continuam vindo do `CONTEXT.md`.

## Decisões resolvidas

### Form factor
- **Desktop-first, responsivo pra baixo.** Projetar para viewport largo; mobile precisa apenas
  **não quebrar** (sem scroll horizontal). Não existe IA (arquitetura de informação) mobile separada.
- Racional: projeto de portfólio avaliado por agentes — coerência e demonstrabilidade pesam mais que
  ergonomia de campo; a grade mensal e o gráfico de projeção (o diferencial do produto) lêem melhor em
  tela larga; um único viewport primário declarado evita cinco histórias de responsividade divergentes.

### Locale
- **pt-BR único.** Sem i18n, sem seletor de idioma. Textos, moeda (`R$`, centavos → `1.234,56`) e datas
  (`dd/MM/yyyy`) formatados em `pt-BR` fixo. Fuso único `America/Sao_Paulo` (já nas convenções globais).

### Casca de navegação e destinos de topo
- **Sidebar esquerda persistente** (desktop). No mobile colapsa em drawer via hambúrguer.
- **Seis destinos de topo, nesta ordem:**
  1. **Dashboard** — landing pós-login (saldo, projeção, alertas)
  2. **Agenda** — calendário mensal de Lançamentos
  3. **Contas** — CRUD de Contas + saldos derivados
  4. **Categorias** — CRUD de Categorias
  5. **Importação Assistida** — upload + revisão de candidatos
  6. **Diagnóstico** — consultor por IA (stretch, construído por último)
- **Sem página "Lançamentos" (lista/tabela) separada.** A **Agenda é o navegador primário** de
  Lançamentos; os Alertas do dashboard linkam para a **Agenda já filtrada**, não para uma tabela própria.
- **Menu de usuário no rodapé da sidebar** (Perfil/Configurações): logout, **Renda Líquida**
  (valor + vigência) e **N dias** do alerta de vencimento próximo (default 7). Não são itens de topo.
- **Renda Líquida não é destino de topo:** consumida pelo Diagnóstico, editada no menu de usuário.

### Casca do Assistente
- **Painel lateral global (slide-over à direita)**, aberto por um **botão persistente** (topbar/sidebar),
  disponível sobre **qualquer** tela. **Não é destino de nav de topo.** O usuário vê Agenda/Dashboard
  atualizarem atrás do painel após uma ação — é o que torna tangível o "ele age no sistema".
- **Leituras** respondem direto no chat, sem cartão.
- **Escritas nunca executam direto:** o Assistente renderiza um **cartão de confirmação inline** no chat
  (resumo estruturado — Tipo, valor, Conta, Categoria, data, Status) com **Confirmar / Cancelar**.
  Só **Confirmar** chama a mesma camada de serviço da UI (`criarLancamento` etc.). Cancelar descarta.
- Quando faltam dados obrigatórios, o Assistente **pergunta no chat** — nunca pré-inventa (ver `CONTEXT.md`).

### Design system
- **Tailwind + shadcn/ui** (primitivos Radix, componentes versionados no repo). Nenhum agente escreve
  componente/CSS do zero quando um shadcn equivalente existe.
- **Tema claro único. Dark mode fora do MVP.** Tokens de cor/tipografia definidos **uma vez** e reusados.

### Linguagem visual/semântica (fonte única — toda tela puxa daqui)
| Conceito | Encoding |
|---|---|
| **Receita** (entrada) | verde; valor com sinal `+` |
| **Despesa** (saída) | vermelho; valor com sinal `−` |
| **Transferência** (neutra) | cinza/azul neutro — **nunca** verde nem vermelho (não é renda nem gasto) |
| **Status EFETIVADO** | sólido/preenchido (aconteceu) |
| **Status PENDENTE** | contorno/esmaecido (previsto) |
| **Atrasado** (pendente vencido) | acento âmbar/vermelho de alerta **sobre** o pendente — nunca um "quarto status" |
| **Saldo negativo** (atual ou projeção cruzando zero) | vermelho de perigo |

Badge de Status na Agenda, cor do valor no Dashboard, linha na tabela de Importação — todos derivam desta tabela.

### Formulário de Lançamento (criar/editar)
- **Superfície única: modal (shadcn `Dialog`)**, um **componente de formulário compartilhado** aberto de
  todos os pontos de entrada. Nunca duplicar o formulário por tela. (Drawer descartado por conflitar com o
  painel do Assistente à direita; rota dedicada descartada por peso numa ação frequente.)
- **Pontos de entrada:** botão global **"＋ Novo Lançamento"** persistente na topbar; e entrada contextual
  pela **Agenda** (clicar num dia pré-preenche a data). Mesmo modal em todos.
- **Default de Status por data** (editável): data no passado → `EFETIVADO`; hoje/futuro → `PENDENTE`.
- Este modal é **distinto** do cartão de confirmação do Assistente — o Assistente não o abre.

### Primeiro contato e estado vazio
- **Sem wizard bloqueante.** Signup semeia Categorias padrão (slice 02); o único vazio de um usuário novo é
  **não ter Conta**.
- **Componente `EmptyState` padronizado, obrigatório em todas as telas:** ícone + **uma** linha de
  explicação + **um** CTA primário. Mesma anatomia na Agenda, Contas, Categorias, Dashboard, Importação.
- **Dashboard vazio** usa o `EmptyState` com CTA "Criar sua primeira Conta" (caso especial, não fluxo à parte).
- **Modal de Lançamento com zero Contas** não mostra formulário: mostra "Crie uma Conta primeiro" com atalho
  para Contas (Conta é pré-requisito duro do Lançamento).

### Primitivos de interação (transversais)
- **`<CurrencyInput>` compartilhado:** máscara `R$ 1.234,56` na UI; converte para **inteiro em centavos** na
  borda form→serviço. Nunca `float`; centavos crus nunca vazam pra UI.
- **`<DateField>` compartilhado:** date picker shadcn, `dd/MM/yyyy`, **date-only**, ancorado em
  `America/Sao_Paulo`. Proibido `new Date()` ingênuo que herde o fuso do browser.
- **Feedback de mutação:** todo resultado de escrita → **toast** (sucesso/erro com mensagem do serviço).
- **Regra de refresh (corolário do ADR-0002):** a UI **nunca recalcula saldo no cliente**. Após qualquer
  mutação, **revalida/re-busca** as views derivadas do servidor — **sem UI otimista que replique o cálculo
  de saldo** (evita duplicar o motor e divergir). O motor é a única fonte numérica.
- **Loading:** **skeletons**, não spinners de tela cheia.

### Charting e Dashboard
- **Lib única de gráfico: shadcn Charts (sobre Recharts).** Nenhum agente traz outra lib (Chart.js/Nivo/etc.).
- **Composição do Dashboard (landing), nesta ordem:**
  1. Linha de **cards**: **Saldo Atual** e **Saldo Projetado (fim do mês)** — cor pela tabela semântica.
  2. **Gráfico de linha** da projeção diária, **destacando o 1º dia que cruza abaixo de zero** (marcador + perigo).
  3. **Painel de Alertas** (atrasados, próximos, projeção negativa) — calculados na hora, **cada um clicável
     leva à Agenda filtrada**.

### Agenda
- **Grade mensal 7 colunas.** Cada Lançamento é um **chip compacto** (cor por Tipo, estilo por Status/atrasado
  — tabela semântica). Máx. **~3 chips/dia**; excedente vira **"+N mais"**.
- **Clique num dia** → **detalhe do dia** (popover) com os Lançamentos + "Novo Lançamento" **com data
  pré-preenchida** (reusa o modal). **Clique num chip** → mesmo modal em **edição**.
- **Mobile:** a grade **colapsa numa lista vertical de dias** com Lançamentos (sem grade espremida, sem scroll
  horizontal).
- **Filtros por URL** (`?status=atrasado`, `?conta=…`, `?proximos=1`) para os deep-links dos Alertas do Dashboard.

### Importação Assistida
- **Passo 1 — Upload:** **Conta de destino obrigatória** (IA não adivinha) + arquivo (PDF-texto/CSV/OFX, sem OCR).
  A Conta destino vira **contexto fixo** no topo da revisão.
- **Passo 2 — Tabela de revisão** (uma linha por Lançamento Candidato):
  - **Edição inline** (data, valor, Categoria, Tipo, descrição) com os primitivos da Questão 7.
  - **Checkbox incluir/excluir** por linha (default **incluído**); excluir = desmarcar, nunca delete destrutivo.
  - **Duplicados** (mesma Conta+data+valor): **badge âmbar + tooltip**, **seguem incluídos** por default
    (sinalizados, nunca removidos automaticamente — `CONTEXT.md`).
  - Default **`EFETIVADO`** (históricos), editável.
  - **"Confirmar N Lançamentos"** em lote → mesma `criarLancamento` por linha marcada; toast + refresh.

### Diagnóstico Financeiro
- **Gated pela Renda Líquida.** Sem ela → `EmptyState` "Informe sua Renda Líquida" (leva ao menu de usuário).
  Nunca tela meio-quebrada.
- **Layout:**
  1. **Cards de métrica determinística** (do motor, nunca da IA): **Taxa de Poupança** (< 10% perigo, ~20%
     saudável), **Reserva atual × meta** com **barra de progresso** (lib única de gráfico), **sobra**.
  2. **Painel de narração da IA** que **referencia** esses números — nunca produz números novos.
  3. **Disclaimer educacional em banner fixo, sempre visível.**
- **Fronteira visual:** números nos cards (motor) × narração no painel (IA) — separação física reforça ADR-0004.

### Ações destrutivas e escopadas
- **Escopo de recorrência (crítico):** editar/excluir um Lançamento com `recorrenciaId` **sempre** dispara um
  **diálogo de escopo compartilhado** — **"Só esta"** vs **"Esta e as futuras"** — antes de aplicar. Nunca
  edição retroativa. Lançamento sem `recorrenciaId` não mostra o diálogo.
- **Transferência é ação separada** ("Nova Transferência": origem, destino, valor, data) que produz o **par
  vinculado**; renderizada com cor **neutra**. Nunca montada como Despesa+Receita à mão, nunca dentro do
  modal de Lançamento comum.
- **Exclusão:** todo delete (Conta, Categoria, Lançamento) passa por `AlertDialog` de confirmação — nunca
  delete de um clique. (Semântica de excluir Conta com Lançamentos é de domínio; a UI só garante a confirmação.)

### Baseline (auth, topbar, breakpoints, acessibilidade)
- **Auth (login/registro):** card centralizado, form shadcn, e-mail + senha, alternância login↔registro, erros
  inline. Sem sidebar (usuário anônimo).
- **Topbar (casca autenticada):** título da tela à esquerda; à direita **"＋ Novo Lançamento"** + **botão do
  Assistente**. Igual em todas as telas.
- **Breakpoints (Tailwind default):** primário **≥ `lg` (1024px)** com sidebar expandida; **< `lg`** colapsa
  em drawer; piso **~360px sem scroll horizontal**. Conjunto único; ninguém inventa breakpoint.
- **Acessibilidade (piso):** label em todo input, foco visível, contraste **AA**. **Regra dura — cor nunca é o
  único canal:** Tipo/Status/atrasado sempre pareiam **cor + ícone/sinal/texto** (`+`/`−`, ícone de atraso).

## Fora de escopo (MVP)
Dark mode; i18n/multi-locale; IA mobile dedicada; push/e-mail (Alerta é sempre in-app derivado); PWA/offline;
UI otimista com recálculo de saldo no cliente.


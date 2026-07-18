---
name: FinCal AI Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#330009'
  on-tertiary: '#ffffff'
  tertiary-container: '#590016'
  on-tertiary-container: '#ff4e69'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  desktop-max-width: 1440px
---

> Companion to [`CONTEXT.md`](../../CONTEXT.md) (domain), the ADRs in [`docs/adr/`](../../adr/) and
> [`dbkit/model/database.md`](../../../dbkit/model/database.md) (schema). Every agent building **any
> screen** follows this document, so independently-built slices form **one coherent app** — same
> shell, same navigation, same interaction patterns — not five bolted-together frontends.
> Rules here are implementation/presentation; domain terms still come from `CONTEXT.md`.

## Product & audience

Agenda financeira inteligente focada em **previsibilidade**: usuário registra Lançamentos (pontuais
ou recorrentes), navega-os num calendário mensal, e a UI existe para deixar óbvio o impacto de
compromissos futuros no Saldo. Público: usuário individual (não há multi-tenant, equipe ou papéis —
isolamento é por `userId`, ADR-0004). Uma sessão típica: abrir o Dashboard, checar alertas, lançar ou
confirmar um Lançamento, checar a Agenda do mês.

## Delivery target

**Web app responsivo, desktop-first** (ADR-0005). Viewport primário declarado **≥ `lg` (1024px)**:
sidebar persistente, grade mensal da Agenda, gráfico de projeção. Abaixo de `lg` a UI **apenas não
quebra** (sidebar → drawer, Agenda → lista vertical, piso ~360px sem scroll horizontal) — não existe
IA mobile dedicada. PWA/instalável e offline **fora do MVP**.

## Stack & framework

**Tailwind + shadcn/ui** (primitivos Radix, componentes versionados no repo). Nenhum agente escreve
componente/CSS do zero quando um equivalente shadcn existe. **Tema claro único — dark mode fora do
MVP**, apesar de `darkMode: "class"` estar configurado no Tailwind do mock (deixado pronto, não
ativado). Gráficos: **shadcn Charts sobre Recharts**, lib única — nenhum agente traz Chart.js/Nivo/etc.

## Brand & visual language

O sistema projeta **previsibilidade, inteligência e confiança institucional** — estilo
**corporativo/moderno**, densidade de dados alta sem abrir mão de whitespace generoso. É a mesma
linguagem que sustenta os "cartões de métrica determinística" do Diagnóstico (ADR-0004: números vêm
do motor, nunca da IA) — a UI precisa parecer **confiável antes de parecer bonita**.

**Cores** — ancoradas em **Navy** (`primary` #091426 / `primary-container` #1e293b) para navegação e
momentos de marca. **Verde institucional** (`secondary` #006c49 / `secondary-container` #6cf8bb) para
crescimento, Receita e ações de sucesso. **Vermelho** (`error` #ba1a1a) para Despesa, saldo negativo e
estados de perigo — um único vermelho para os dois, o que muda é o peso visual (badge discreto vs.
cartão de alerta cheio). `tertiary` (família rosa/vinho #330009–#ff4e69) é reservado para **superfícies
de alerta crítico** (ex.: cartão "Projeção Negativa" no Dashboard) — mais intenso que `error`, usado
com parcimônia para não competir com Despesa/perigo no dia a dia. Neutros (`surface-container-*`)
formam o esqueleto estrutural.

Cor é sempre funcional (estado), nunca decorativa — ver tabela semântica abaixo.

**Tipografia** — **Geist** para headlines/labels (caráter técnico e preciso), **Inter** para corpo de
texto (legibilidade em telas densas de dados). **Todo valor monetário usa tabular-nums** — decimais
alinham verticalmente em listas, crítico para comparação financeira.

**Forma** — cantos arredondados (nunca 0px — o produto existe para trazer paz financeira, não
agressividade): botões/inputs `0.5rem`, cards/painéis `1rem`, badges/pills `xl`/`full`.

**Elevação** — superfícies brancas sobre fundo `surface` claro ("elevação natural"), sombras
extra-difusas e de baixa opacidade tingidas de Navy quando precisa de profundidade (dropdowns, cards
em hover).

## Semantic color table (única fonte — toda tela puxa daqui)

| Conceito | Encoding |
|---|---|
| **Receita** (entrada) | `secondary` (verde); valor com sinal `+` |
| **Despesa** (saída) | `error` (vermelho); valor com sinal `−` |
| **Transferência** (neutra) | `surface-container-high` / `on-surface-variant` — nunca verde nem vermelho (não é renda nem gasto) |
| **Status EFETIVADO** | sólido/preenchido (aconteceu) |
| **Status PENDENTE** | contorno/esmaecido (previsto) |
| **Atrasado** (pendente vencido) | acento âmbar/`error` **sobre** o badge pendente — nunca um "quarto status" |
| **Saldo negativo** (atual ou projeção cruzando zero) | `error`, peso visual mais forte (cartão `tertiary` quando é alerta de destaque) |

Badge de Status na Agenda, cor do valor no Dashboard, linha da tabela de Importação — todos derivam
desta tabela. **Regra dura de acessibilidade:** cor nunca é o único canal — Tipo/Status/atrasado
sempre pareiam cor + ícone/sinal/texto (`+`/`−`, ícone de atraso).

## App shell & navigation

- **Sidebar esquerda persistente** (desktop, 280px). No mobile colapsa em drawer via hambúrguer.
- **Seis destinos de topo, nesta ordem:** Dashboard, Agenda, Contas, Categorias, Importação Assistida,
  Diagnóstico. Menu por permissão não se aplica (sem RBAC multi-usuário) — todo usuário autenticado vê
  os seis.
- **Sem página "Lançamentos" separada.** A **Agenda é o navegador primário** de Lançamentos; Alertas do
  Dashboard linkam para a Agenda já filtrada (`?status=atrasado`, `?conta=…`, `?proximos=1`), nunca para
  uma tabela própria. *(O mock em `code.html`/`screen.png` tem um item "Lançamentos" e "Relatórios" na
  sidebar — descartado, é herança de um template genérico gerado antes deste contrato; não seguir.)*
- **Menu de usuário no rodapé da sidebar:** logout, Renda Líquida (valor + vigência), N dias do alerta
  de vencimento próximo (default 7). Não são itens de topo.
- **Topbar:** título da tela à esquerda; à direita **"＋ Novo Lançamento"** + botão do Assistente. Igual
  em todas as telas.

## Assistant shell

- **Painel lateral global (slide-over à direita)**, aberto por botão persistente na topbar — disponível
  sobre qualquer tela, **não é destino de nav de topo** (o bubble flutuante do mock também não segue —
  mesmo motivo do item acima).
- Leituras respondem direto no chat, sem cartão. **Escritas nunca executam direto:** cartão de
  confirmação inline (Tipo, valor, Conta, Categoria, data, Status) com Confirmar/Cancelar — só Confirmar
  chama a mesma camada de serviço da UI. Dado faltando → o Assistente pergunta no chat.

## Forms & CRUD

Superfície por peso da entidade (`dbkit/model/database.md`):

- **Lançamento** — entidade mais pesada e mais frequente → **modal único compartilhado** (shadcn
  `Dialog`), aberto do botão global "＋ Novo Lançamento" e da Agenda (clique no dia pré-preenche a
  data; clique num chip abre em edição). Default de Status por data: passado → `EFETIVADO`,
  hoje/futuro → `PENDENTE` (editável). Zero Contas cadastradas → não mostra formulário, mostra "Crie
  uma Conta primeiro" com atalho (Conta é pré-requisito duro, CAT-05/relations).
- **Conta** e **Categoria** — poucos campos (`conta`: nome, papel, Saldo Inicial · `categoria`: nome,
  tipo, cor/ícone cosmético) → mesmo padrão **modal**, sem necessidade de superfície dedicada.
  **Asimetria create/edit:** `categoria.tipo` é **imutável após criar** (é metade da chave natural
  `UNIQUE(userId, tipo, nome)`, CAT-04 — mudar o tipo de uma Categoria em uso reclassificaria
  Lançamentos existentes silenciosamente). `conta.papel` é editável (não é chave, e recategorizar uma
  Conta — ex. de `CORRENTE` para `RESERVA` — é uma correção legítima).
- **Exclusão** (Conta, Categoria, Lançamento) — sempre `AlertDialog` de confirmação, nunca delete de um
  clique. Excluir Conta/Categoria com Lançamentos vinculados falha com erro do serviço (`ON DELETE
  RESTRICT`, CAT-05) — a UI mostra o erro, não tenta prevenir client-side (o motor é a fonte da
  verdade).
- **Transferência** — ação separada ("Nova Transferência": origem, destino, valor, data), nunca dentro
  do modal de Lançamento comum. Produz o par vinculado (`transferenciaId`), renderizado em cor neutra.
  Clicar numa perna na Agenda **abre em edição** o mesmo formulário "Nova Transferência" pré-preenchido
  — qualquer alteração reescreve as duas pernas atomicamente (caminho único de escrita, TRA-02).
  Exclusão sempre remove o par, nunca uma perna isolada.
- **Criação de Lançamento recorrente:** toggle **"Repetir"** dentro do próprio modal de Lançamento
  (desligado por padrão). Ligar revela inline frequência (`MENSAL`/`SEMANAL`), dia e fim opcional; o
  submit cria a `recorrencia` em vez de um Lançamento avulso. Mantém o modal único — nenhum fluxo
  separado, nenhum segundo lugar para manter os seletores de Conta/Categoria.
- **Escopo de recorrência (crítico):** editar/excluir um Lançamento com `recorrenciaId` sempre dispara
  diálogo de escopo — "Só esta" vs "Esta e as futuras" — antes de aplicar. Nunca edição retroativa.
  Lançamento sem `recorrenciaId` não mostra o diálogo.
- **Renda Líquida** — append-only por design (REN-01): o menu de usuário mostra o valor vigente atual +
  "vigente desde"; editar **sempre cria uma nova vigência** (nunca sobrescreve uma linha passada — não
  há UI de editar/apagar histórico).
- **Primitivos compartilhados:** `<CurrencyInput>` (máscara `R$ 1.234,56`, converte para inteiro em
  centavos na borda form→serviço, nunca `float`) e `<DateField>` (shadcn date picker, `dd/MM/yyyy`,
  date-only, `America/Sao_Paulo`, proibido `new Date()` ingênuo).
- **Dirty-form guard:** fechar um modal com alterações não salvas (X, backdrop, Esc) pede confirmação
  (`AlertDialog` "Descartar alterações?") — mesmo componente de confirmação usado em deletes, não um
  padrão novo.

## Feedback & states

- **Loading:** skeletons, nunca spinner de tela cheia.
- **Empty states:** componente `EmptyState` padronizado e obrigatório em toda tela — ícone + uma linha
  de explicação + um CTA primário. Mesma anatomia em Agenda, Contas, Categorias, Dashboard, Importação.
  Dashboard vazio (zero Contas) é um caso do mesmo componente, CTA "Criar sua primeira Conta".
- **Mutações:** pessimista — nunca UI otimista que recalcule saldo no cliente (corolário do ADR-0002:
  o motor é a única fonte numérica). Toda escrita revalida/re-busca as views derivadas do servidor.
- **Toast** para resultado de toda mutação (sucesso/erro com mensagem do serviço). **Inline** reservado
  para erros de validação de formulário (ex.: login/registro).

## Identity & access

Auth simples (Auth.js, e-mail + senha): card centralizado, form shadcn, alternância login↔registro,
erros inline, sem sidebar (usuário anônimo). Sem papéis/RBAC — todo usuário autenticado vê os mesmos
seis destinos, isolado por `userId`. Recuperação de senha por e-mail fica **fora do MVP** (sem infra de
envio de e-mail no projeto) — mesmo racional do ADR de escopo.

## Responsiveness

Breakpoints Tailwind default; primário **≥ `lg` (1024px)** com sidebar expandida, **< `lg`** colapsa em
drawer, piso **~360px sem scroll horizontal** — conjunto único, ninguém inventa breakpoint (ADR-0005).
Agenda: grade 7 colunas no desktop → lista vertical de dias no mobile.

## Out of scope (MVP)

Dark mode, i18n/multi-locale, IA mobile dedicada, push/e-mail (Alerta é sempre in-app derivado),
PWA/offline, UI otimista com recálculo de saldo no cliente, recuperação de senha por e-mail, RBAC
multi-usuário.

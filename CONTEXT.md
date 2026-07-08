# FinCal AI

Agenda financeira inteligente: o usuário registra receitas e despesas (pontuais ou recorrentes), visualiza-as num calendário mensal, e o foco do produto é **previsibilidade** — enxergar o impacto de compromissos futuros no saldo. Inclui um assistente em linguagem natural que executa ações no sistema.

## Language

**Lançamento**:
Unidade central do domínio — um evento financeiro único, de entrada ou saída, com data, valor, categoria, conta e status. É o único conceito para o que também se chama de "vencimento", "conta a pagar" ou "compromisso".
_Avoid_: Transação, conta a pagar, agendamento (como entidades separadas)

**Tipo (do Lançamento)**:
A direção do dinheiro: **Receita** (entrada) ou **Despesa** (saída).

**Transferência**:
Movimentação de dinheiro **entre duas Contas do próprio usuário** — um par vinculado (saída na origem + entrada no destino, mesmo valor e data, mesmo `transferenciaId`). É **neutra**: move saldo entre Contas mas **não conta como Receita nem como Despesa** nos totais, para não distorcer gastos, renda nem a Taxa de Poupança. Não é um Lançamento comum.
_Avoid_: modelar um aporte/movimentação interna como um par Despesa+Receita

**Status (do Lançamento)**:
Onde o Lançamento está no eixo planejado × realizado. `PENDENTE` = previsto, ainda não efetivado (conta no saldo projetado, não no atual). `EFETIVADO` = já aconteceu, dinheiro entrou/saiu (conta no saldo atual). O valor previsto é uma estimativa: ao efetivar, o valor pode ser **ajustado** para o real. Não há **pagamento parcial** — a transição PENDENTE→EFETIVADO é total.
_Avoid_: "Pago" e "Recebido" como estados distintos no modelo — é o mesmo estado `EFETIVADO` visto por tipos diferentes.

**Atrasado**:
Condição **derivada**, não um status persistido: um Lançamento `PENDENTE` cuja data de vencimento já passou. Nunca há um job que "vira" o status.

**Conta**:
Onde o dinheiro reside. Guarda apenas um **Saldo Inicial** (âncora) — nunca um saldo materializado. Tem um **Papel**: `CORRENTE` (dia a dia), `RESERVA` (poupança/emergência), `INVESTIMENTO`, ou `CARTAO`. Cartão é tratado como Conta genérica (sem lógica de fatura; saldo pode ficar negativo), e o papel `CARTAO` é o mesmo marcador que a Importação Assistida usa para identificar a conta do cartão.
_Avoid_: "carteira", "banco" como conceitos separados

**Reserva atual**:
Soma do saldo das Contas com papel `RESERVA` (e `CORRENTE`) — **excluindo `INVESTIMENTO` e `CARTAO`**. É o que o Diagnóstico compara com a meta de reserva; distinta do saldo consolidado, que inclui tudo.

**Saldo Inicial**:
Valor-âncora informado pelo usuário ao criar a Conta. É o único saldo armazenado.

**Saldo Atual (realizado)**:
Derivado: `Saldo Inicial + Σ Lançamentos EFETIVADOS até hoje`. Representa o dinheiro que de fato entrou/saiu.

**Saldo Projetado**:
Derivado. Modelado como uma **série diária** ao longo de um horizonte, não um número único: `saldoProjetado(D) = Saldo Inicial + Σ Lançamentos (EFETIVADOS ou PENDENTES) com data ≤ D`. É o diferencial do produto — dele saem "quanto terei no fim do mês", "vou ficar negativo no dia X" e o gráfico de projeção. **Consolidado** (todas as Contas) por padrão, filtrável por Conta. Horizonte padrão: fim do mês corrente, mas o cálculo aceita qualquer data-alvo.

**Recorrência**:
Uma **regra** (tipo, valor, categoria, conta, frequência, dia, data de início, data de fim opcional) que **materializa Lançamentos concretos** de forma preguiçosa (lazy) — sem cron. Cada ocorrência é um Lançamento normal com `recorrenciaId`. Editar/excluir tem dois escopos: **só esta** (marca a ocorrência como modificada, imune à regeneração) ou **esta e as futuras** (altera a regra e regenera futuras não-modificadas). Não há edição retroativa.
_Avoid_: "assinatura", "conta fixa" como conceitos distintos

**Categoria**:
Rótulo de classificação de um Lançamento, com um **Tipo** associado (receita ou despesa). Pré-semeada por usuário na criação da conta e editável por ele. Sem hierarquia (não há subcategorias); cor/ícone são cosméticos.

**Alerta**:
Condição financeira relevante, sempre **derivada/calculada na hora** (nunca persistida, sem notificação externa). Três tipos no MVP: Lançamentos **atrasados**, vencimentos **próximos** (pendentes nos próximos N dias), e **saldo projetado negativo** em algum dia do horizonte. Exibidos no dashboard.
_Avoid_: "notificação" (implica push/email, que não existem no MVP)

**Assistente**:
Camada de chat em linguagem natural que traduz mensagens do usuário em chamadas de **tool** (function calling) sobre a mesma camada de serviço da UI. Tools rodam sempre no escopo do usuário autenticado (`userId` vem da sessão, nunca do modelo). **Leituras** executam direto; **escritas** exigem confirmação explícita do usuário antes de efetivar. Quando faltam dados obrigatórios, o Assistente **pergunta** — nunca inventa Conta ou valor.
_Avoid_: "chatbot", "bot" (subestimam o caráter agêntico/executor)

**Importação Assistida**:
Fluxo em que o usuário sobe um extrato/fatura (PDF com texto, CSV/OFX — **sem OCR** no MVP), a IA extrai **Lançamentos Candidatos** via structured outputs, e eles passam por **revisão humana** antes de virarem Lançamentos. Nunca há gravação automática. Extrair linhas de uma fatura de cartão **não** é modelar o ciclo de faturamento — cada linha vira uma despesa comum. A **Conta de destino é escolhida no upload** (a IA não a adivinha); candidatos entram como `EFETIVADO` por padrão (são históricos); duplicados (mesma Conta+data+valor) são apenas **sinalizados**, nunca removidos automaticamente.

**Lançamento Candidato**:
Proposta de Lançamento extraída pela IA de um documento, exibida numa tabela de revisão. Só vira **Lançamento** de verdade quando o usuário confirma — e a confirmação chama a mesma `criarLancamento` da camada de serviço.
_Avoid_: tratar candidatos como Lançamentos antes da confirmação

**Diagnóstico Financeiro**:
Recurso de consultor por IA (stretch goal, construído por último). Calcula de forma **determinística** métricas da vida financeira do usuário e a IA **narra** recomendações por cima — **sem inventar números**, com disclaimer educacional. Só existe se a **Renda Líquida** estiver preenchida. Reaproveita o motor: **gastos fixos = despesas com Recorrência**; **gastos do dia a dia = despesas pontuais**; **sobra = renda − gastos**.
_Avoid_: "coach", "planejador" como recursos separados

**Renda Líquida**:
Renda líquida mensal **declarada** pelo usuário, armazenada **com vigência** (valor + "vigente desde"), formando um histórico simples. É a **régua** (renda estável planejada) que ancora as **metas** do Diagnóstico e a taxa de poupança-alvo — deliberadamente **independente** das Receitas realizadas (Lançamentos). A divergência entre a régua e o que de fato entrou é um **sinal** que o Diagnóstico pode explorar, não uma inconsistência. Reserva e independência são ancoradas em **gastos**, não na renda.

**Taxa de Poupança**:
Métrica-título do Diagnóstico: `sobra ÷ Renda Líquida`. Piso de referência 10%, meta saudável ~20%. Não requer rastrear investimentos.

**Reserva de Emergência (meta)**:
`6 × gasto mensal médio` (ancorada em gastos, não em salário), onde **gasto mensal médio = média das Despesas EFETIVADAS dos últimos 3 meses completos** (fixos + dia a dia, excluindo Transferências; fallback para o histórico disponível se houver menos de 3 meses). Comparada com a **Reserva atual** (não o saldo consolidado). Faixa ideal varia por estabilidade de renda (~3–6× CLT, 6–12× renda variável).

## Relationships

- Um **Lançamento** tem exatamente um **Tipo**, um **Status**, uma **Conta** e uma **Categoria**; opcionalmente uma **Recorrência** de origem
- Uma **Importação Assistida** produz muitos **Lançamentos Candidatos**; cada candidato confirmado vira exatamente um **Lançamento**
- Uma **Recorrência** produz muitos **Lançamentos**; o motor de saldo não distingue recorrente de pontual
- Uma **Conta** não guarda saldo; todo saldo é uma **função pura dos Lançamentos** + Saldo Inicial
- "Vencimentos", "contas em atraso" e "compromissos futuros" são todos **Lançamentos** filtrados por Status/data, não entidades próprias

## Example dialogue

> **Dev:** "O aluguel que vence dia 10 e o aluguel que já paguei mês passado são coisas diferentes no banco?"
> **Domain expert:** "Não — os dois são **Lançamentos**. A diferença é o **Status**: o de mês passado é `EFETIVADO`, o do dia 10 é `PENDENTE`. Se hoje fosse dia 12 e ele seguisse `PENDENTE`, aí ele está **Atrasado** — mas isso eu calculo na hora, não guardo."

## Flagged ambiguities

- "vencimento", "conta a pagar", "compromisso" foram usados como se fossem entidades — resolvido: são todos **Lançamentos** vistos por filtros.
- Mover dinheiro entre contas próprias vs gastar/receber — resolvido: é **Transferência** (neutra), nunca um par Despesa+Receita.
- **Renda Líquida** (declarada, a régua) vs **Receitas** (realizadas) — resolvido: independentes por design; a divergência é sinal, não bug.
- "pago" vs "recebido" — resolvido: mesmo Status `EFETIVADO`, a diferença é o **Tipo**.

# A IA nunca é fonte da verdade numérica

Em todo uso de IA no FinCal — o **Assistente** conversacional, a **Importação Assistida** de extratos/faturas e o **Diagnóstico Financeiro** — o modelo **traduz linguagem natural e narra recomendações sobre uma base determinística e testável**. Todo número (saldo, saldo projetado, métricas do diagnóstico) vem do **motor de domínio**, nunca do modelo. Ações de escrita passam por **confirmação/revisão humana** antes de efetivar.

Escolhemos assim para manter a lógica financeira testável (funções puras, sem LLM no caminho) e evitar alucinação em cima de dinheiro. Um futuro colaborador poderia "simplificar" pedindo os cálculos direto ao modelo; isso é deliberadamente rejeitado — a IA opera *sobre* o domínio, não *no lugar* dele. As tools do Assistente são wrappers finos sobre a mesma camada de serviço da UI, sempre no escopo do `userId` da sessão.

# Recorrência materializa Lançamentos de forma preguiçosa (lazy)

Uma **Recorrência** é uma regra que **gera Lançamentos concretos** (cada ocorrência é uma linha com `recorrenciaId`). A geração é **preguiçosa e sem cron**: ao navegar para um mês ou projetar até uma data, o sistema materializa as ocorrências que faltam até ali.

Escolhemos materializar (em vez de expandir a regra virtualmente no cálculo, ou usar um job agendado) porque assim **tudo é um Lançamento** — motor de saldo, agenda e dashboard tratam recorrente e pontual de forma idêntica, e marcar uma ocorrência como paga é mudar o Status de uma linha, sem tabela de exceções. Um leitor futuro poderia tentar substituir isto por um cron ou por expansão virtual; ambos foram considerados e rejeitados por adicionarem complexidade (infra de background / tabela de overrides) sem ganho no escopo de um usuário.

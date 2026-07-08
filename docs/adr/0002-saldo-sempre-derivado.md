# Saldo sempre derivado dos Lançamentos

A **Conta** armazena apenas um **Saldo Inicial** (âncora). Todo saldo exibido — Saldo Atual e Saldo Projetado — é **calculado a partir dos Lançamentos** como uma função pura (`saldo(data) = saldoInicial + Σ lançamentos aplicáveis até a data`), nunca um valor materializado que precise ser mantido em sincronia.

Escolhemos assim porque o foco do produto é **projeção**, e ter os Lançamentos como fonte única da verdade torna a lógica testável (função pura) e elimina toda uma classe de bugs de dessincronização. Um leitor futuro poderia esperar um campo de saldo na Conta e "otimizar" nessa direção — isso é deliberadamente evitado; performance não é preocupação com SQLite e volume de um usuário.

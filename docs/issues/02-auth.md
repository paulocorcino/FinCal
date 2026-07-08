# Auth: registro e login por e-mail/senha

## What to build

Cadastro e autenticação reais com Auth.js + adapter do Prisma: registro por **e-mail + senha** (hash com bcrypt/argon2), login, sessão, e uma rota protegida que redireciona anônimos. No signup, **semear as Categorias padrão** do usuário (Moradia, Alimentação, Transporte, Salário, Lazer, etc., cada uma com seu Tipo receita/despesa). Todas as entidades de domínio passam a carregar `userId`.

## Acceptance criteria

- [ ] Registrar cria User com senha hasheada; e-mail duplicado é rejeitado
- [ ] Login estabelece sessão; logout encerra
- [ ] Rota protegida inacessível sem sessão
- [ ] Categorias padrão semeadas no signup, associadas ao `userId`
- [ ] Teste de integração: dois usuários não enxergam dados um do outro (isolamento por `userId`)
- [ ] Evidência: fluxo registrar→login→acessar rota protegida

## Blocked by

- Slice 01 (walking-skeleton)

# Auth: login/registro e semeadura de Categorias

## What to build

Autenticação com **Auth.js**, e-mail + senha. Card centralizado (sem sidebar para usuário anônimo), formulário shadcn com **alternância login↔registro** e **erros inline**. Toda entidade nasce com `userId`; toda query filtra por ele (base do isolamento — ADR-0004). No **registro**, o sistema **semeia Categorias padrão** para o novo usuário, de modo que seu único vazio bloqueante seja "não ter Conta" — sem wizard. Logout disponível pelo **menu de usuário no rodapé da sidebar**.

## Acceptance criteria

- [ ] Registrar com e-mail + senha cria o usuário e inicia sessão; login autentica; erros aparecem inline
- [ ] Alternância login↔registro no mesmo card centralizado, sem sidebar
- [ ] Registro **semeia Categorias padrão** (com Tipo) para o novo `userId`
- [ ] Rotas autenticadas exigem sessão; anônimo é redirecionado ao login
- [ ] Menu de usuário no rodapé da sidebar com **logout**
- [ ] Evidência: teste do fluxo registrar→semear→login→logout + screenshot do card

## Blocked by

- Slice 01 (walking-skeleton)

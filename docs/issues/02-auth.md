# Autenticação: registro, login e Categorias padrão

## What to build

Autenticação com **Auth.js**, e-mail + senha. Card centralizado (sem sidebar, usuário anônimo), com
alternância login↔registro e erros de validação **inline** no formulário. Ao registrar, o usuário
ganha um espaço isolado por `userId` (ADR-0004) e um conjunto de **Categorias padrão** pré-semeadas
(algumas de Receita, algumas de Despesa), editáveis depois. Após login, a casca autenticada (Slice 01)
passa a exibir a sidebar/topbar; logout fica no menu de usuário no rodapé da sidebar.

## Acceptance criteria

- [ ] Registro com e-mail (único, `COLLATE NOCASE`) + senha cria `user` e sessão autenticada
- [ ] Login com credenciais corretas autentica; credenciais erradas mostram erro inline, sem crash
- [ ] Alternância login↔registro no mesmo card, sem navegação de página
- [ ] Registro semeia um conjunto de Categorias padrão (Receita e Despesa) para o novo `userId`
- [ ] Logout pelo menu de usuário encerra a sessão e volta ao card de auth
- [ ] Toda rota autenticada redireciona para o login quando não há sessão
- [ ] Evidência: teste de isolamento (Categorias semeadas pertencem só ao `userId` do registro) + screenshot do card

## Blocked by

- Slice 01 (walking-skeleton)

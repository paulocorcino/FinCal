# Categorias: CRUD plano com Tipo imutável

## What to build

CRUD de **Categoria** (nome, **Tipo** ∈ `RECEITA`/`DESPESA`, cor/ícone cosméticos) na tela
"Categorias", mesmo padrão **modal** de peso leve. Sem hierarquia — Categorias são planas, sem
subcategorias. Chave natural `UNIQUE(userId, tipo, nome COLLATE NOCASE)` (CAT-04): mesmo nome pode
existir em Receita e em Despesa, mas não duplicado dentro do mesmo Tipo. **Asimetria create/edit:**
`tipo` é **imutável após criar** (mudar o tipo de uma Categoria em uso reclassificaria Lançamentos
existentes silenciosamente) — o campo aparece travado no modal de edição. Exclusão com Lançamentos
vinculados falha com o erro do serviço (`ON DELETE RESTRICT`, CAT-05).

## Acceptance criteria

- [ ] Criar Categoria (nome, tipo, cor/ícone opcional) pelo modal
- [ ] Editar Categoria: campo `tipo` **desabilitado/somente-leitura** no modo edição; nome e cosméticos editáveis
- [ ] Duplicar nome dentro do mesmo Tipo é rejeitado (mensagem clara); mesmo nome em Tipos diferentes é permitido
- [ ] `AlertDialog` de confirmação em toda exclusão; excluir Categoria em uso mostra o erro do serviço
- [ ] Lista sem hierarquia/subcategorias
- [ ] Evidência: teste da constraint `UNIQUE(userId, tipo, nome)` + teste de que editar não altera `tipo` + screenshot

## Blocked by

- Slice 02 (auth)

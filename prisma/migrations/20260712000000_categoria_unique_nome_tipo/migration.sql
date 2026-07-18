-- DropIndex
DROP INDEX IF EXISTS "Categoria_userId_nome_key";

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_userId_nome_tipo_key" ON "Categoria"("userId", "nome", "tipo");

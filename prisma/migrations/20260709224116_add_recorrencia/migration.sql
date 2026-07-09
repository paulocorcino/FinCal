-- CreateTable
CREATE TABLE "Recorrencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "dataInicio" TEXT NOT NULL,
    "dataFim" TEXT,
    "frequencia" TEXT NOT NULL,
    "dia" INTEGER NOT NULL,
    "contaId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recorrencia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recorrencia_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recorrencia_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecorrenciaExcecao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recorrenciaId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    CONSTRAINT "RecorrenciaExcecao_recorrenciaId_fkey" FOREIGN KEY ("recorrenciaId") REFERENCES "Recorrencia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lancamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "data" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "recorrenciaId" TEXT,
    "modificado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lancamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lancamento_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lancamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lancamento_recorrenciaId_fkey" FOREIGN KEY ("recorrenciaId") REFERENCES "Recorrencia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lancamento" ("categoriaId", "contaId", "createdAt", "data", "id", "status", "tipo", "updatedAt", "userId", "valor") SELECT "categoriaId", "contaId", "createdAt", "data", "id", "status", "tipo", "updatedAt", "userId", "valor" FROM "Lancamento";
DROP TABLE "Lancamento";
ALTER TABLE "new_Lancamento" RENAME TO "Lancamento";
CREATE INDEX "Lancamento_userId_idx" ON "Lancamento"("userId");
CREATE INDEX "Lancamento_recorrenciaId_idx" ON "Lancamento"("recorrenciaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Recorrencia_userId_idx" ON "Recorrencia"("userId");

-- CreateIndex
CREATE INDEX "RecorrenciaExcecao_recorrenciaId_idx" ON "RecorrenciaExcecao"("recorrenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "RecorrenciaExcecao_recorrenciaId_data_key" ON "RecorrenciaExcecao"("recorrenciaId", "data");

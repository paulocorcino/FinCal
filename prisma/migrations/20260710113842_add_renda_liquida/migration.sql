-- CreateTable
CREATE TABLE "RendaLiquida" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "valor" INTEGER NOT NULL,
    "vigenteDesde" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RendaLiquida_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RendaLiquida_userId_idx" ON "RendaLiquida"("userId");

-- CreateIndex
CREATE INDEX "RendaLiquida_userId_vigenteDesde_idx" ON "RendaLiquida"("userId", "vigenteDesde");

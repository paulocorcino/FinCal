import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATEGORIAS_PADRAO } from "@/lib/categorias-padrao";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@fincal.app";
  const password = "fincal123";
  const passwordHash = await bcrypt.hash(password, 10);

  const demoUser = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      name: "Usuário Demo",
      passwordHash,
    },
  });

  await prisma.categoria.deleteMany({ where: { userId: demoUser.id } });
  await prisma.categoria.createMany({
    data: CATEGORIAS_PADRAO.map((c) => ({ userId: demoUser.id, ...c })),
  });

  console.log(`Seed concluído: demo user ${email} (senha: ${password})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

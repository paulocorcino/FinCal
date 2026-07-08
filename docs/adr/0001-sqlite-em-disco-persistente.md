# SQLite em disco persistente, deploy não-serverless

O FinCal AI usa **SQLite** como banco (arquivo montado em um volume persistente, ex.: `/data/fincal.db` via `DATABASE_URL="file:/data/fincal.db"`), acessado através do Prisma, e é implantado como um **container tradicional com disco persistente** (Railway/Render/VPS via um `Dockerfile` único), **não** em plataforma serverless.

Escolhemos assim porque é um projeto solo de escopo enxuto onde a simplicidade operacional (um arquivo, zero serviço de banco a gerenciar) supera a necessidade de escala ou concorrência alta. Isso descarta o caminho "óbvio" de Next.js na Vercel, cujo filesystem efêmero e somente-leitura é incompatível com SQLite. O Prisma mantém o código quase agnóstico ao banco, então uma futura migração para Postgres é possível, porém deliberadamente adiada.

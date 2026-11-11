/** pnpm --filter @escola/db seed */
import { criarPrisma } from "./index";
import { semear } from "./seed";

const prisma = criarPrisma(process.env.DATABASE_URL ?? "postgresql://escola:escola@localhost:5442/escola");
semear(prisma)
  .then((r) => console.log("Seed concluído:", r))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

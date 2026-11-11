import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

export * from "./generated/client";
export { rodarDetector } from "./detector";

export function criarPrisma(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL não definida");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export interface Contexto {
  userId: string;
  /** null = ainda não escolheu a escola (só enxerga os próprios vínculos). */
  schoolId: string | null;
}

/**
 * Toda leitura e escrita da API passa por aqui. As variáveis valem só dentro da transação
 * (set_config com is_local = true), e o Row Level Security do PostgreSQL filtra pela escola.
 */
export async function comEscola<T>(prisma: PrismaClient, ctx: Contexto, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`select set_config('app.user_id', ${ctx.userId}, true), set_config('app.school_id', ${ctx.schoolId ?? ""}, true)`;
      return fn(tx);
    },
    { timeout: 20_000, maxWait: 5_000 },
  );
}

import { readFileSync } from "node:fs";
import pg from "pg";

/** Aplica prisma/rls.sql com o superusuário. Idempotente: rodar depois de cada migração. */
const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgresql://escola:escola@localhost:5442/escola" });
await cliente.connect();
await cliente.query(readFileSync(new URL("../prisma/rls.sql", import.meta.url), "utf8"));
await cliente.end();
console.log("RLS aplicado.");

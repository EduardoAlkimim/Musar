import { defineConfig } from "tsup";

// Empacota a API com o pacote de domínio. Sem metadados de decorador: as dependências
// são injetadas com @Inject(TOKEN) explícito, então o esbuild basta (sem SWC nativo).
export default defineConfig({
  entry: ["src/main.ts"],
  format: ["cjs"],
  target: "node22",
  platform: "node",
  sourcemap: true,
  clean: true,
  noExternal: ["@escola/domain", "@escola/db"],
});

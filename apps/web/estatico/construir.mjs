/**
 * Monta a demonstração estática do MUSAR (GitHub Pages) a partir do código de apps/web:
 * copia o projeto, troca a API pelos dados capturados (estatico/dados.json) e as ações por
 * simulações, tira o que precisa de servidor (login, rotas da demo local, proxy) e exporta HTML.
 *
 *   BASE_PATH=/Musar pnpm --filter @escola/web build:estatico   →  apps/web/out-estatico/
 */
import { appendFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const web = fileURLToPath(new URL("..", import.meta.url));
const alvo = join(web, ".build-estatico");
const saida = join(web, "out-estatico");

if (!existsSync(join(web, "estatico", "dados.json"))) {
  console.error("Falta estatico/dados.json. Rode antes: pnpm --filter @escola/web capturar:estatico");
  process.exit(1);
}

const FORA = ["node_modules", ".next", ".build-estatico", "out-estatico", ".env.local", "proxy.ts", "next-env.d.ts", "tsconfig.tsbuildinfo",
  join("app", "entrar"), join("app", "auth"), join("app", "sair"), join("app", "demo", "passo"), join("app", "demo", "reiniciar"), join("app", "demo", "sair"), join("estatico", "sobrepor")];

rmSync(alvo, { recursive: true, force: true });
rmSync(saida, { recursive: true, force: true });
mkdirSync(alvo, { recursive: true });
// Item por item: o destino fica dentro de apps/web, e o Node não copia uma pasta para dentro dela mesma.
for (const nome of readdirSync(web)) {
  if (FORA.includes(nome)) continue;
  cpSync(join(web, nome), join(alvo, nome), { recursive: true, filter: (origem) => !FORA.includes(relative(web, origem)) });
}
cpSync(join(web, "estatico", "sobrepor"), alvo, { recursive: true, force: true });

// O tsconfig herda da raiz do monorepo, um nível mais acima agora.
const ts = join(alvo, "tsconfig.json");
writeFileSync(ts, readFileSync(ts, "utf8").replace('"../../tsconfig.base.json"', '"../../../tsconfig.base.json"'));

// Toda página vira HTML no build; as de [id] listam os ids capturados.
const paginas = [];
const varrer = (dir) => {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) varrer(p);
    else if (nome === "page.tsx") paginas.push(p);
  }
};
varrer(join(alvo, "app"));
for (const p of paginas) {
  const texto = readFileSync(p, "utf8");
  if (texto.startsWith("export {")) continue; // reexporta outra página
  appendFileSync(p, '\nexport const dynamic = "force-static";\n');
  const rel = relative(alvo, p).split("\\").join("/");
  const ids = rel.includes("gestao/turmas/[id]") ? "turmas" : rel.includes("provas/[id]") ? "provas" : null;
  if (ids) appendFileSync(p, `import __dados from "@/estatico/dados.json";\nexport const dynamicParams = false;\nexport function generateStaticParams() { return __dados.ids.${ids}.map((id: string) => ({ id })); }\n`);
}

const next = join(web, "node_modules", "next", "dist", "bin", "next");
execFileSync(process.execPath, [next, "build"], { cwd: alvo, stdio: "inherit", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
renameSync(join(alvo, "out"), saida);

// O Next 16 grava os segmentos de pré-carregamento em pastas (__next.X/professor/__PAGE__.txt), mas o
// navegador os pede num nome só, com pontos (__next.X.professor.__PAGE__.txt). Sem servidor para
// reescrever (GitHub Pages), gravamos também a cópia com o nome pedido.
let segmentos = 0;
const achatar = (dir) => {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (!statSync(p).isDirectory()) continue;
    if (nome.startsWith("__next.")) {
      const copiar = (sub, prefixo) => {
        for (const n of readdirSync(sub)) {
          const q = join(sub, n);
          if (statSync(q).isDirectory()) copiar(q, `${prefixo}.${n}`);
          else { cpSync(q, join(dir, `${prefixo}.${n}`)); segmentos += 1; }
        }
      };
      copiar(p, nome);
    } else achatar(p);
  }
};
achatar(saida);
console.log(`${segmentos} segmentos de navegação copiados com o nome pedido pelo navegador`);
writeFileSync(join(saida, ".nojekyll"), "");
rmSync(alvo, { recursive: true, force: true });
console.log(`Demonstração estática pronta em ${relative(process.cwd(), saida)}`);

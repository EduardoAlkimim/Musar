/**
 * Captura os dados da demonstração estática (GitHub Pages) a partir do ambiente local real.
 * Percorre a história da demonstração (indicar → família aprova → reforço agenda) e guarda
 * a resposta da API que cada tela usa, no estado certo daquele passo. Só dados fictícios do seed.
 *
 *   docker compose up -d && pnpm --filter @escola/api start   (em outro terminal)
 *   pnpm --filter @escola/web capturar:estatico
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const API = process.env.API_URL ?? "http://localhost:4000/api";
const KC = process.env.KEYCLOAK_ISSUER ?? "http://localhost:8080/realms/musar";
const raiz = new URL("../../../", import.meta.url);

const semear = () => execSync("pnpm --filter @escola/db seed", { cwd: raiz, stdio: "ignore" });

async function token(u) {
  const r = await fetch(`${KC}/protocol/openid-connect/token`, {
    method: "POST",
    body: new URLSearchParams({ grant_type: "password", client_id: "musar-web", client_secret: "musar-web-local", username: `${u}@musar.local`, password: "musar-local", scope: "openid" }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`Login de ${u} falhou: ${JSON.stringify(j)}`);
  return j.access_token;
}

const tokens = {};
async function chamar(u, metodo, caminho, corpo) {
  tokens[u] ??= await token(u);
  const r = await fetch(API + caminho, { method: metodo, headers: { Authorization: `Bearer ${tokens[u]}`, "content-type": "application/json" }, body: corpo ? JSON.stringify(corpo) : undefined });
  const j = await r.json();
  if (!r.ok) throw new Error(`${metodo} ${caminho} (${u}) → ${r.status} ${JSON.stringify(j)}`);
  return j;
}

const respostas = {};
const guardar = async (u, caminho) => (respostas[caminho] = await chamar(u, "GET", caminho));

semear();
const me = {};
for (const u of ["ana", "marta", "renato", "helena", "joao", "admin"]) me[u] = await chamar(u, "GET", "/me");

// Passos 1 e 2: a direção, no estado inicial (João ainda aguardando decisão).
for (const c of ["/gestao/visao-geral", "/gestao/alertas", "/gestao/turmas", "/gestao/equipe", "/gestao/reforcos", "/coordenacao"]) await guardar("ana", c);
const turmas = respostas["/gestao/turmas"].map((t) => t.id);
for (const id of turmas) await guardar("ana", `/gestao/turmas/${id}`);
await guardar("admin", "/admin/resumo");

// A professora indica o Renato para o João (o que o passo 2 simula).
const painel = await chamar("marta", "GET", "/professor/painel");
const joao = painel.alertas.find((a) => a.aluno.nome === "João Gomes");
const renato = painel.sugestoes[joao.habilidade.id].find((s) => s.nome === "Renato Siqueira");
const pedido = await chamar("marta", "POST", `/alertas/${joao.id}/encaminhar`, { tutorId: renato.id });

// Passo 3: a professora, já com o João no reforço.
await guardar("marta", "/professor/painel");
await guardar("marta", "/professor/atribuicoes");
const provas = respostas["/professor/atribuicoes"].provas.map((p) => p.id);
for (const id of provas) {
  await guardar("marta", `/provas/${id}/relatorio`);
  await guardar("marta", `/provas/${id}/lancamento`);
}

// Passo 4: a família, com o termo aceito e o pedido aguardando aprovação.
const f0 = await chamar("helena", "GET", "/familia");
const filho = f0.filhos[0];
await chamar("helena", "POST", "/familia/consentimento", { alunoId: filho.id, versao: filho.versaoTermo });
await guardar("helena", "/familia");
const profMat = respostas["/familia"].filhos[0].professores.find((p) => p.materia === "Matemática");
await chamar("helena", "POST", "/mensagens", { alunoId: filho.id, paraId: profMat.id, texto: "Professora, o João pode fazer o reforço na terça?" });
await guardar("marta", "/mensagens");

// Passo 5: o reforço, com a família já tendo aprovado.
await chamar("helena", "POST", `/reforco/pedidos/${pedido.id}/aprovar`);
await guardar("renato", "/reforco/fila");

// Passo 6: o aluno, com a primeira sessão agendada.
const quinta = new Date();
quinta.setDate(quinta.getDate() + ((4 - quinta.getDay() + 7) % 7 || 7));
await chamar("renato", "POST", `/reforco/pedidos/${pedido.id}/aceitar`, { inicio: `${quinta.toISOString().slice(0, 10)}T14:00:00-03:00`, modo: "presencial" });
await guardar("joao", "/aluno");

semear(); // deixa o ambiente local como estava
const destino = new URL("./dados.json", import.meta.url);
writeFileSync(destino, JSON.stringify({ geradoEm: new Date().toISOString(), me, ids: { turmas, provas }, respostas }, null, 1));
console.log(`Dados da demonstração estática gravados: ${Object.keys(respostas).length} telas.`);

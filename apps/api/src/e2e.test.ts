/**
 * Fluxo completo contra o ambiente local real (PostgreSQL com RLS + Keycloak).
 * Precisa de `docker compose up -d` e roda o seed antes. Ligado só com E2E=1:
 *
 *   E2E=1 pnpm --filter @escola/api test
 */
import "reflect-metadata";
import { execSync } from "node:child_process";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ligado = process.env.E2E === "1";
const KC = process.env.KEYCLOAK_ISSUER ?? "http://localhost:8080/realms/trilha";

async function token(usuario: string) {
  const r = await fetch(`${KC}/protocol/openid-connect/token`, {
    method: "POST",
    body: new URLSearchParams({ grant_type: "password", client_id: "trilha-web", client_secret: "trilha-web-local", username: `${usuario}@trilha.local`, password: "trilha-local", scope: "openid" }),
  });
  return ((await r.json()) as { access_token: string }).access_token;
}

describe.skipIf(!ligado)("fluxo prova → alerta → reforço (ambiente local)", () => {
  let app: INestApplication;
  const tokens: Record<string, string> = {};
  const como = (u: string) => ({
    get: (url: string) => request(app.getHttpServer()).get(`/api${url}`).set("Authorization", `Bearer ${tokens[u]}`),
    post: (url: string, corpo: object = {}) => request(app.getHttpServer()).post(`/api${url}`).set("Authorization", `Bearer ${tokens[u]}`).send(corpo),
  });

  beforeAll(async () => {
    execSync("pnpm --filter @escola/db seed", { stdio: "ignore", cwd: `${__dirname}/../../..` });
    process.env.DETECTOR_DIARIO = "0";
    const { AppModule } = await import("./app.module");
    app = (await Test.createTestingModule({ imports: [AppModule] }).compile()).createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
    for (const u of ["marta", "helena", "renato", "luiza", "joao", "beatriz", "admin"]) tokens[u] = await token(u);
  }, 120_000);
  afterAll(() => app?.close());

  let alertaId = "";
  let tutorId = "";
  let pedidoId = "";
  let sessaoId = "";
  let alunoId = "";
  let profId = "";
  let provaId = "";

  it("sem token não entra; papel errado é barrado", async () => {
    await request(app.getHttpServer()).get("/api/me").expect(401);
    await como("marta").get("/coordenacao").expect(403);
    await como("joao").get("/professor/painel").expect(403);
  });

  it("painel da professora traz alertas, sugestões e a última prova", async () => {
    const r = await como("marta").get("/professor/painel").expect(200);
    expect(r.body.turma.nome).toBe("6º ano B");
    expect(r.body.resumo.sentence).toMatch(/precisa(m)? de reforço em frações/);
    const joao = r.body.alertas.find((a: { aluno: { nome: string } }) => a.aluno.nome === "João Gomes");
    alertaId = joao.id;
    const sug = r.body.sugestoes[joao.habilidade.id];
    expect(sug).toHaveLength(3);
    tutorId = sug.find((s: { nome: string }) => s.nome === "Renato Siqueira").id;
    provaId = r.body.prova.id;
  });

  it("aluno não vê o relatório da turma", async () => {
    await como("joao").get(`/provas/${provaId}/relatorio`).expect(403);
  });

  it("encaminha uma vez só e, sendo menor, aguarda o responsável", async () => {
    const r = await como("marta").post(`/alertas/${alertaId}/encaminhar`, { tutorId }).expect(201);
    expect(r.body.status).toBe("AGUARDANDO_RESPONSAVEL");
    pedidoId = r.body.id;
    await como("marta").post(`/alertas/${alertaId}/encaminhar`, { tutorId }).expect(409);
  });

  it("família precisa aceitar o termo antes de ver dados ou aprovar", async () => {
    const f0 = await como("helena").get("/familia").expect(200);
    expect(f0.body.filhos[0].precisaConsentimento).toBe(true);
    alunoId = f0.body.filhos[0].id;
    await como("helena").post(`/reforco/pedidos/${pedidoId}/aprovar`).expect(403);
    await como("helena").post("/familia/consentimento", { alunoId, versao: "v1.0" }).expect(201);
    const f1 = await como("helena").get("/familia").expect(200);
    expect(f1.body.filhos[0].reforcos[0].status).toBe("AGUARDANDO_RESPONSAVEL");
    profId = f1.body.filhos[0].professores.find((p: { materia: string }) => p.materia === "Matemática").id;
  });

  it("reforço só começa depois da aprovação", async () => {
    await como("renato").post(`/reforco/pedidos/${pedidoId}/aceitar`, { inicio: "2026-11-17T14:00:00-03:00", modo: "presencial" }).expect(409);
    await como("helena").post(`/reforco/pedidos/${pedidoId}/aprovar`).expect(201);
    const r = await como("renato").post(`/reforco/pedidos/${pedidoId}/aceitar`, { inicio: "2026-11-17T14:00:00-03:00", modo: "presencial" }).expect(201);
    sessaoId = r.body.sessao.id;
  });

  it("só o professor do pedido registra a sessão", async () => {
    await como("renato").post(`/reforco/sessoes/${sessaoId}/registro`, { texto: "Frações equivalentes com barras." }).expect(201);
    await como("luiza").post(`/reforco/sessoes/${sessaoId}/registro`, { texto: "tentativa" }).expect(404);
  });

  it("mensagem só entre responsável e professores da turma", async () => {
    await como("helena").post("/mensagens", { alunoId, paraId: profId, texto: "Ele pode levar a lista na quinta?" }).expect(201);
    await como("helena").post("/mensagens", { alunoId, paraId: tutorId, texto: "oi" }).expect(403);
    const inbox = await como("marta").get("/mensagens").expect(200);
    expect(inbox.body.some((m: { recebida: boolean; texto: string }) => m.recebida && m.texto.includes("quinta"))).toBe(true);
  });

  it("prova nova: cria, lança respostas e corrige pelo gabarito", async () => {
    const at = await como("marta").get("/professor/atribuicoes").expect(200);
    const seisB = at.body.atribuicoes.find((a: { turma: string }) => a.turma === "6º ano B");
    const hab = seisB.habilidades[0].id;
    const nova = await como("marta")
      .post("/provas", { atribuicaoId: seisB.id, titulo: "Miniteste", data: "2026-11-11", questoes: [0, 1].map((g) => ({ alternativas: ["A", "B", "C", "D"], gabarito: g, habilidadeId: hab })) })
      .expect(201);
    await como("joao").post("/provas", { atribuicaoId: seisB.id, titulo: "x", data: "2026-11-11", questoes: [] }).expect(403);
    const r = await como("marta").post(`/provas/${nova.body.id}/respostas`, { respostas: [{ alunoId, numero: 1, marcada: 0 }, { alunoId, numero: 2, marcada: 3 }] }).expect(201);
    expect(r.body.alunos[0]).toMatchObject({ correct: 1, total: 2, score: 5 });
    await como("marta").post(`/provas/${nova.body.id}/respostas`, { respostas: [{ alunoId, numero: 1, marcada: 4 }] }).expect(400);
  });

  it("aluno vê a revisão do erro; coordenação vê a escola", async () => {
    const a = await como("joao").get("/aluno").expect(200);
    expect(a.body.prova.erradas.length).toBeGreaterThan(0);
    const c = await como("beatriz").get("/coordenacao").expect(200);
    expect(c.body.tabela).toHaveLength(4);
  });

  it("importação valida tudo antes de gravar", async () => {
    const ruim = "nome;email;data_nascimento;turma;serie;turno\nA;nao-e-email;2014-01-01;6º E;6º ano;manhã\n";
    const r = await como("admin").post("/admin/importar", { csv: ruim }).expect(400);
    expect(r.body.erros[0].linha).toBe(2);
    const bom = "nome;email;data_nascimento;turma;serie;turno\nNova Aluna;nova.aluna@alunos.exemplo.br;2014-01-01;6º ano E;6º ano;manhã\n";
    const ok = await como("admin").post("/admin/importar", { csv: bom }).expect(201);
    expect(ok.body).toMatchObject({ alunosCriados: 1, turmasCriadas: 1 });
  });

  it("conclui o reforço e o alerta é resolvido", async () => {
    await como("renato").post(`/reforco/pedidos/${pedidoId}/concluir`, { fechou: true }).expect(201);
    const fila = await como("renato").get("/reforco/fila").expect(200);
    expect(fila.body.itens.some((i: { id: string }) => i.id === pedidoId)).toBe(false);
  });
});

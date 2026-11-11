import "reflect-metadata";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "./app.module";
import { CamadaLlm, LimiteDeUsoAtingido, pseudonimizar, type ProvedorLlm } from "./ia/llm";

let app: INestApplication;

beforeAll(async () => {
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = mod.createNestApplication();
  app.setGlobalPrefix("api");
  await app.init();
});
afterAll(() => app.close());

const api = () => request(app.getHttpServer());

describe("API", () => {
  it("relatório da prova da escola de demonstração", async () => {
    const r = await api().get("/api/escolas/demo/provas/av-6b-4bim/relatorio").expect(200);
    expect(r.body.students).toHaveLength(24);
    expect(r.body.questions).toHaveLength(10);
  });

  it("não mostra prova de outra escola", async () => {
    await api().get("/api/escolas/outra/provas/av-6b-4bim/relatorio").expect(404);
  });

  it("corrige respostas enviadas, sem IA", async () => {
    const r = await api()
      .post("/api/escolas/demo/provas/av-6b-4bim/correcao")
      .send({ respostas: [{ studentId: "6b-01", questionId: "q1", chosen: 0 }, { studentId: "6b-01", questionId: "q2", chosen: 0 }] })
      .expect(201);
    expect(r.body.students[0]).toMatchObject({ studentId: "6b-01", correct: 1, total: 10, score: 1 });
  });

  it("recusa aluno de outra turma e alternativa inexistente", async () => {
    await api().post("/api/escolas/demo/provas/av-6b-4bim/correcao")
      .send({ respostas: [{ studentId: "6a-01", questionId: "q1", chosen: 0 }] }).expect(400);
    await api().post("/api/escolas/demo/provas/av-6b-4bim/correcao")
      .send({ respostas: [{ studentId: "6b-01", questionId: "q1", chosen: 9 }] }).expect(400);
  });

  it("alertas da turma com frase-decisão", async () => {
    const r = await api().get("/api/escolas/demo/turmas/6b/alertas").expect(200);
    expect(r.body.resumo.sentence).toBe("4 alunos precisam de reforço em frações");
    await api().get("/api/escolas/outra/turmas/6b/alertas").expect(404);
  });

  it("sugere 3 professores de reforço e valida o código BNCC", async () => {
    const r = await api().get("/api/escolas/demo/reforco/sugestoes?habilidade=EF06MA07").expect(200);
    expect(r.body).toHaveLength(3);
    expect(r.body[0].professor.nome).toBe("Renato Siqueira");
    await api().get("/api/escolas/demo/reforco/sugestoes?habilidade=fracoes").expect(400);
  });
});

describe("camada de IA", () => {
  const ok: ProvedorLlm = { gerar: async (_p, modelo) => ({ texto: "ok", modelo, tokensEntrada: 1, tokensSaida: 1 }) };
  const cfg = { modelos: { simples: "barato", chat: "chat", analise: "analise" }, fallback: "reserva", limiteDiarioPorEscola: 2 };
  const pedido = { tarefa: "simples" as const, schoolId: "a", sistema: "", mensagem: "" };

  it("usa o modelo da tarefa", async () => {
    expect((await new CamadaLlm(ok, cfg).gerar(pedido)).modelo).toBe("barato");
  });

  it("cai no fallback quando o modelo principal falha", async () => {
    const falha: ProvedorLlm = {
      gerar: async (p, modelo) => {
        if (modelo === "chat") throw new Error("fora do ar");
        return ok.gerar(p, modelo);
      },
    };
    expect((await new CamadaLlm(falha, cfg).gerar({ ...pedido, tarefa: "chat" })).modelo).toBe("reserva");
  });

  it("respeita o limite diário por escola", async () => {
    const llm = new CamadaLlm(ok, cfg, () => "2026-11-11");
    await llm.gerar(pedido);
    await llm.gerar(pedido);
    await expect(llm.gerar(pedido)).rejects.toBeInstanceOf(LimiteDeUsoAtingido);
    await expect(llm.gerar({ ...pedido, schoolId: "b" })).resolves.toBeDefined();
  });

  it("tira documento, e-mail e telefone antes de enviar", () => {
    expect(pseudonimizar("CPF 123.456.789-09, ana@x.com, (31) 98765-4321")).toBe("CPF [documento], [e-mail], [telefone]");
  });
});

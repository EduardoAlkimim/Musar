import { describe, expect, it } from "vitest";
import { CamadaLlm, LimiteDeUsoAtingido, pseudonimizar, type ProvedorLlm } from "./ia/llm";
import { lerCsv } from "./rotas/admin.controller";

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

describe("planilha de importação", () => {
  it("aceita ponto e vírgula (Excel pt-BR), aspas e BOM", () => {
    const csv = '﻿nome;email\n"Silva; Ana";ana@x.com\n"Diz ""oi""";b@x.com\n';
    expect(lerCsv(csv)).toEqual([["nome", "email"], ["Silva; Ana", "ana@x.com"], ['Diz "oi"', "b@x.com"]]);
  });
  it("aceita vírgula e ignora linhas vazias", () => {
    expect(lerCsv("a,b\r\n\r\n1,2\r\n")).toEqual([["a", "b"], ["1", "2"]]);
  });
});

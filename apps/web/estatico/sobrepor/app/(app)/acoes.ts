/**
 * Versão estática: as ações respondem como a API responderia, mas nada é gravado.
 * Mesmos nomes e assinaturas de app/(app)/acoes.ts.
 */
import dados from "@/estatico/dados.json";

export type Resultado = { ok: true; mensagem?: string; id?: string } | { ok: false; erro: string; erros?: { linha: number; erro: string }[] };

const espera = () => new Promise((r) => setTimeout(r, 450));
async function ok(mensagem?: string, id?: string): Promise<Resultado> {
  await espera();
  return { ok: true, mensagem, id };
}

type Tutor = { id: string; nome: string };
const tutores = ((dados.respostas as Record<string, { tutores?: Tutor[] }>)["/gestao/alertas"]?.tutores ?? []) as Tutor[];

export const encaminhar = (_alertaId: string, tutorId: string) =>
  ok(`Para ${tutores.find((t) => t.id === tutorId)?.nome ?? "o professor escolhido"}. Aguardando o responsável.`);
export const descartarAlerta = (_alertaId: string) => ok();
export const consentir = (_alunoId: string, _versao: string) => ok();
export const aprovarReforco = (_pedidoId: string) => ok();
export const recusarReforco = (_pedidoId: string) => ok();
export const aceitarPlano = (_pedidoId: string, _inicio: string, _modo: string) => ok();
export const agendarSessao = (_pedidoId: string, _inicio: string, _modo: string) => ok();
export const registrarSessao = (_sessaoId: string, _texto: string) => ok();
export const concluirReforco = (_pedidoId: string, _fechou: boolean) => ok();
export const enviarMensagem = (_alunoId: string, _paraId: string, _texto: string) => ok();
export const marcarLida = (_id: string) => ok();
export const rodarDetector = () => ok("0 novos, 0 resolvidos");
export const criarProva = (_dados: unknown) => ok(undefined, dados.ids.provas[0]);
export const lancarRespostas = (_provaId: string, _respostas: unknown[]) => ok();

export async function importarPlanilha(csv: string, simular: boolean): Promise<Resultado> {
  const linhas = csv.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const sep = (linhas[0] ?? "").includes(";") ? ";" : ",";
  const alunos = linhas.length - 1;
  if (alunos <= 0) return { ok: false, erro: "A planilha não tem alunos" };
  const turmas = new Set(linhas.slice(1).map((l) => l.split(sep)[3]?.trim())).size;
  return ok(simular ? `${alunos} linhas prontas para importar` : `${alunos} alunos novos, 0 atualizados, ${turmas} turma${turmas === 1 ? " nova" : "s novas"}`);
}

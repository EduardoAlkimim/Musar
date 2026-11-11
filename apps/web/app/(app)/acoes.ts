"use server";

import { revalidatePath } from "next/cache";
import { acao } from "@/lib/api";

/**
 * Resultado de toda ação: a tela mostra o carimbo ou a mensagem de erro.
 * Ações de linha (encaminhar, aprovar, agendar…) não recarregam a página: o carimbo fica
 * visível e os dados novos vêm na próxima visita (as páginas são sempre dinâmicas).
 */
export type Resultado = { ok: true; mensagem?: string; id?: string } | { ok: false; erro: string; erros?: { linha: number; erro: string }[] };

const plural = (n: unknown, um: string, varios: string) => `${n} ${Number(n) === 1 ? um : varios}`;

async function rodar(caminho: string, corpo: unknown, revalidar: string[], mensagem?: (d: Record<string, unknown>) => string): Promise<Resultado> {
  const r = await acao<Record<string, unknown>>(caminho, corpo);
  if (!r.ok) return r;
  for (const p of revalidar) revalidatePath(p);
  return { ok: true, mensagem: mensagem?.(r.dados), id: typeof r.dados.id === "string" ? r.dados.id : undefined };
}

export async function encaminhar(alertaId: string, tutorId: string) {
  return rodar(`/alertas/${alertaId}/encaminhar`, { tutorId }, [], (d) =>
    d.status === "AGUARDANDO_RESPONSAVEL" ? `Para ${d.tutor}. Aguardando o responsável.` : `Para ${d.tutor}. Já pode começar.`,
  );
}

export async function descartarAlerta(alertaId: string) {
  return rodar(`/alertas/${alertaId}/descartar`, {}, []);
}

export async function consentir(alunoId: string, versao: string) {
  return rodar("/familia/consentimento", { alunoId, versao }, ["/familia"]);
}

export async function aprovarReforco(pedidoId: string) {
  return rodar(`/reforco/pedidos/${pedidoId}/aprovar`, {}, []);
}

export async function recusarReforco(pedidoId: string) {
  return rodar(`/reforco/pedidos/${pedidoId}/recusar`, {}, []);
}

export async function aceitarPlano(pedidoId: string, inicio: string, modo: string) {
  return rodar(`/reforco/pedidos/${pedidoId}/aceitar`, { inicio, modo }, []);
}

export async function agendarSessao(pedidoId: string, inicio: string, modo: string) {
  return rodar(`/reforco/pedidos/${pedidoId}/sessoes`, { inicio, modo }, []);
}

export async function registrarSessao(sessaoId: string, texto: string) {
  return rodar(`/reforco/sessoes/${sessaoId}/registro`, { texto }, []);
}

export async function concluirReforco(pedidoId: string, fechou: boolean) {
  return rodar(`/reforco/pedidos/${pedidoId}/concluir`, { fechou }, []);
}

export async function enviarMensagem(alunoId: string, paraId: string, texto: string) {
  return rodar("/mensagens", { alunoId, paraId, texto }, ["/mensagens"]);
}

export async function marcarLida(id: string) {
  return rodar(`/mensagens/${id}/lida`, {}, ["/mensagens"]);
}

export async function rodarDetector() {
  return rodar("/detector/rodar", {}, ["/coordenacao", "/professor"], (d) => `${d.criados} novos, ${d.resolvidos} resolvidos`);
}

export async function criarProva(dados: unknown) {
  return rodar("/provas", dados, ["/professor/provas"]);
}

export async function lancarRespostas(provaId: string, respostas: { alunoId: string; numero: number; marcada: number | null }[]) {
  return rodar(`/provas/${provaId}/respostas`, { respostas }, ["/professor", `/professor/provas/${provaId}`]);
}

export async function importarPlanilha(csv: string, simular: boolean) {
  return rodar("/admin/importar", { csv, simular }, ["/admin"], (d) =>
    d.simulado ? `${d.linhas} linhas prontas para importar` : [plural(d.alunosCriados, "aluno novo", "alunos novos"), plural(d.alunosAtualizados, "atualizado", "atualizados"), plural(d.turmasCriadas, "turma nova", "turmas novas")].join(", "),
  );
}

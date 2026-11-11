/**
 * Versão estática (GitHub Pages): no lugar da API, as respostas capturadas da escola de
 * demonstração (estatico/dados.json). Mesma assinatura da lib/api.ts real.
 */
import dados from "@/estatico/dados.json";

export class ErroApi extends Error {
  constructor(
    public readonly status: number,
    public readonly corpo: { erro?: string; erros?: { linha: number; erro: string }[]; precisaConsentimento?: boolean } & Record<string, unknown>,
  ) {
    super(corpo?.erro ?? `Erro ${status}`);
  }
}

export async function tokenAtual() {
  return "demonstracao-estatica";
}

export async function api<T>(caminho: string): Promise<T> {
  const respostas = dados.respostas as Record<string, unknown>;
  const chave = caminho.split("?")[0]!;
  if (!(chave in respostas)) throw new Error(`A demonstração estática não tem dados para ${chave}. Rode pnpm --filter @escola/web capturar:estatico.`);
  return respostas[chave] as T;
}

export async function acao(): Promise<{ ok: false; erro: string }> {
  return { ok: false, erro: "Na demonstração estática as ações são simuladas pelos componentes." };
}

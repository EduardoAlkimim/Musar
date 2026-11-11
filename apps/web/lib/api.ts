import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { abrir, COOKIE, ENV } from "./sessao";

export class ErroApi extends Error {
  constructor(
    public readonly status: number,
    public readonly corpo: { erro?: string; erros?: { linha: number; erro: string }[]; precisaConsentimento?: boolean } & Record<string, unknown>,
  ) {
    super(corpo?.erro ?? `Erro ${status}`);
  }
}

export async function tokenAtual() {
  return (await abrir((await cookies()).get(COOKIE)?.value))?.access ?? null;
}

/** Chamada à API a partir do servidor do Next. Sem sessão, manda para o login. */
export async function api<T>(caminho: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await tokenAtual();
  if (!token) redirect("/entrar");
  const r = await fetch(`${ENV.apiUrl}${caminho}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, ...(init.body !== undefined ? { "content-type": "application/json" } : {}) },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (r.status === 401) redirect("/entrar");
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErroApi(r.status, corpo);
  return corpo as T;
}

/** Para ações (server actions): devolve { ok, erro } em vez de lançar, para a tela mostrar a mensagem. */
export async function acao<T>(caminho: string, body?: unknown): Promise<{ ok: true; dados: T } | { ok: false; erro: string; erros?: { linha: number; erro: string }[] }> {
  try {
    return { ok: true, dados: await api<T>(caminho, { method: "POST", body: body ?? {} }) };
  } catch (e) {
    if (e instanceof ErroApi) return { ok: false, erro: e.corpo.erro ?? "Não deu certo. Tente de novo.", erros: e.corpo.erros };
    throw e;
  }
}

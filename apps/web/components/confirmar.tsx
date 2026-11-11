"use client";

import { useState, useTransition } from "react";
import * as acoes from "@/app/(app)/acoes";
import type { Resultado } from "@/app/(app)/acoes";

/**
 * Ação a executar, pelo nome e argumentos (serializável: a página no servidor só descreve,
 * o botão no navegador chama). Na versão local é a ação real; na demonstração estática, a simulada.
 */
export interface Acao { nome: Exclude<keyof typeof acoes, "Resultado">; args?: unknown[] }
export const executar = (a: Acao) => (acoes as unknown as Record<string, (...x: unknown[]) => Promise<Resultado>>)[a.nome]!(...(a.args ?? []));

/**
 * Botão de ação real: chama a server action e vira carimbo quando a API confirma.
 * Se der erro, mostra a mensagem da API e deixa tentar de novo.
 */
export function Confirmar({
  rotulo,
  carimbo,
  depois,
  acao,
  variante = "tinta",
  confirmar,
}: {
  rotulo: string;
  carimbo: string;
  depois?: string;
  acao: Acao;
  variante?: "tinta" | "linha" | "texto";
  /** Pergunta antes de agir (ações que não se desfazem). */
  confirmar?: string;
}) {
  const [estado, setEstado] = useState<Resultado | null>(null);
  const [pendente, iniciar] = useTransition();

  if (estado?.ok) {
    return (
      <span className="inline-flex flex-wrap items-center gap-3" role="status">
        <span className="carimbo">{carimbo}</span>
        {(estado.mensagem ?? depois) && <span className="text-sm text-suave">{estado.mensagem ?? depois}</span>}
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pendente}
        className={(variante === "tinta" ? "btn btn-primario" : variante === "linha" ? "btn btn-secundario" : "link min-h-11 text-sm text-suave hover:text-marinho") + " disabled:opacity-60"}
        onClick={() => {
          if (confirmar && !window.confirm(confirmar)) return;
          iniciar(async () => setEstado(await executar(acao)));
        }}
      >
        {pendente ? "Enviando…" : rotulo}
      </button>
      {estado && !estado.ok && <span role="alert" className="text-sm text-perigo">{estado.erro}</span>}
    </span>
  );
}

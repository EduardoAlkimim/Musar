"use client";

import { useState, useTransition } from "react";
import type { Resultado } from "@/app/(app)/acoes";

/** Duas saídas para a mesma pergunta (aprovar ou recusar): escolhida uma, a outra some. */
export function Decidir({
  sim,
  nao,
}: {
  sim: { rotulo: string; carimbo: string; depois?: string; acao: () => Promise<Resultado> };
  nao: { rotulo: string; carimbo: string; depois?: string; acao: () => Promise<Resultado>; confirmar?: string };
}) {
  const [feito, setFeito] = useState<{ r: Resultado; qual: "sim" | "nao" } | null>(null);
  const [pendente, iniciar] = useTransition();
  const rodar = (qual: "sim" | "nao") => {
    const o = qual === "sim" ? sim : nao;
    if (qual === "nao" && nao.confirmar && !window.confirm(nao.confirmar)) return;
    iniciar(async () => setFeito({ r: await o.acao(), qual }));
  };

  if (feito?.r.ok) {
    const o = feito.qual === "sim" ? sim : nao;
    return (
      <span className="inline-flex flex-wrap items-center gap-3" role="status">
        <span className="carimbo">{o.carimbo}</span>
        {o.depois && <span className="text-sm text-suave">{o.depois}</span>}
      </span>
    );
  }
  return (
    <span className="flex flex-col items-start gap-2">
      <span className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primario disabled:opacity-60" disabled={pendente} onClick={() => rodar("sim")}>{pendente ? "Enviando…" : sim.rotulo}</button>
        <button type="button" className="btn btn-secundario disabled:opacity-60" disabled={pendente} onClick={() => rodar("nao")}>{nao.rotulo}</button>
      </span>
      {feito && !feito.r.ok && <span role="alert" className="text-sm text-perigo">{feito.r.erro}</span>}
    </span>
  );
}

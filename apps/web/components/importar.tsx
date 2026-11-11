"use client";

import { useState, useTransition } from "react";
import { importarPlanilha, type Resultado } from "@/app/(app)/acoes";

/** Importação em dois passos: conferir (nada é gravado) e importar. */
export function Importar() {
  const [csv, setCsv] = useState("");
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [conferido, setConferido] = useState<Resultado | null>(null);
  const [final, setFinal] = useState<Resultado | null>(null);
  const [pendente, iniciar] = useTransition();

  function ler(f: File) {
    setArquivo(f.name);
    setConferido(null);
    setFinal(null);
    f.text().then(setCsv);
  }

  if (final?.ok) {
    return (
      <p className="flex flex-wrap items-center gap-3" role="status">
        <span className="carimbo">Importado</span>
        <span>{final.mensagem}</span>
      </p>
    );
  }
  const erro = (final && !final.ok ? final : conferido && !conferido.ok ? conferido : null) as Extract<Resultado, { ok: false }> | null;

  return (
    <div className="space-y-5">
      <label className="folha flex cursor-pointer flex-col items-start gap-2 border-dashed p-6 hover:border-pauta-forte">
        <span className="font-semibold">{arquivo ?? "Escolher a planilha (.csv)"}</span>
        <span className="text-sm text-grafite">No Excel ou Google Planilhas: Arquivo → Salvar como / Fazer download → CSV.</span>
        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && ler(e.target.files[0])} />
      </label>

      {csv && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="botao-linha disabled:opacity-60" disabled={pendente} onClick={() => iniciar(async () => setConferido(await importarPlanilha(csv, true)))}>
            {pendente && !conferido ? "Conferindo…" : "1. Conferir"}
          </button>
          <button type="button" className="botao-tinta disabled:opacity-60" disabled={pendente || !conferido?.ok} onClick={() => iniciar(async () => setFinal(await importarPlanilha(csv, false)))}>
            {pendente && conferido?.ok ? "Importando…" : "2. Importar"}
          </button>
          {conferido?.ok && <span className="text-sm text-escola">{conferido.mensagem}</span>}
        </div>
      )}

      {erro && (
        <div role="alert" className="border-l-2 border-alerta pl-4">
          <p className="font-semibold">{erro.erro}</p>
          {erro.erros && (
            <ul className="mt-2 space-y-1 text-sm">
              {erro.erros.slice(0, 30).map((e, i) => <li key={i}>{e.linha > 0 ? `Linha ${e.linha}: ` : ""}{e.erro}</li>)}
              {erro.erros.length > 30 && <li className="text-grafite">e mais {erro.erros.length - 30}…</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { enviarMensagem, type Resultado } from "@/app/(app)/acoes";

/** Escrever para um professor (família) ou responder um responsável (professor). */
export function NovaMensagem({ alunoId, destinatarios, rotulo = "Enviar" }: { alunoId: string; destinatarios: { id: string; nome: string; detalhe?: string }[]; rotulo?: string }) {
  const [para, setPara] = useState(destinatarios[0]?.id ?? "");
  const [texto, setTexto] = useState("");
  const [r, setR] = useState<Resultado | null>(null);
  const [pendente, iniciar] = useTransition();

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const res = await enviarMensagem(alunoId, para, texto);
          setR(res);
          if (res.ok) setTexto("");
        });
      }}
    >
      {destinatarios.length > 1 && (
        <label className="grid gap-1.5 text-sm">
          <span className="rotulo">Para</span>
          <select className="h-11 rounded-[10px] border border-borda bg-white px-3 text-base" value={para} onChange={(e) => setPara(e.target.value)}>
            {destinatarios.map((d) => <option key={d.id} value={d.id}>{d.nome}{d.detalhe ? ` · ${d.detalhe}` : ""}</option>)}
          </select>
        </label>
      )}
      <label className="sr-only" htmlFor={`msg-${alunoId}-${para}`}>Mensagem</label>
      <textarea id={`msg-${alunoId}-${para}`} rows={4} required minLength={2} value={texto} onChange={(e) => setTexto(e.target.value)} className="campo resize-y" placeholder="Escreva sua mensagem" />
      <div className="flex items-center gap-3">
        <button className="btn btn-secundario disabled:opacity-60" disabled={pendente || !para}>{pendente ? "Enviando…" : rotulo}</button>
        {r && !r.ok && <span role="alert" className="text-sm text-perigo">{r.erro}</span>}
        {r?.ok && !texto && (
          <span role="status" className="inline-flex items-center gap-3">
            <span className="carimbo">Enviado</span>
            <span className="text-sm text-suave">{r.mensagem}</span>
          </span>
        )}
      </div>
    </form>
  );
}

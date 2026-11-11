"use client";

import { useState, useTransition } from "react";
import { aceitarPlano, agendarSessao, concluirReforco, registrarSessao, type Resultado } from "@/app/(app)/acoes";

const campo = "h-11 rounded-[10px] border border-borda bg-white px-3 text-base focus:outline-none focus-visible:border-azul";

function Retorno({ r, carimbo }: { r: Resultado | null; carimbo: string }) {
  if (!r) return null;
  return r.ok ? <span className="carimbo" role="status">{carimbo}</span> : <span role="alert" className="text-sm text-perigo">{r.erro}</span>;
}

/** Data/hora local (yyyy-mm-ddThh:mm) → ISO com o fuso do navegador. */
function isoLocal(v: string) {
  const d = new Date(v);
  const off = -d.getTimezoneOffset();
  const s = off >= 0 ? "+" : "-";
  const p = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, "0");
  return `${v}:00${s}${p(off / 60)}:${p(off % 60)}`;
}

export function Agendar({ pedidoId, sugestao, primeira }: { pedidoId: string; sugestao: string; primeira: boolean }) {
  const [quando, setQuando] = useState(sugestao);
  const [modo, setModo] = useState("presencial");
  const [r, setR] = useState<Resultado | null>(null);
  const [pendente, iniciar] = useTransition();
  if (r?.ok) return <Retorno r={r} carimbo="Agendado" />;
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => setR(await (primeira ? aceitarPlano : agendarSessao)(pedidoId, isoLocal(quando), modo)));
      }}
    >
      <label className="grid gap-1 text-sm"><span className="rotulo">Quando</span><input type="datetime-local" required className={campo} value={quando} onChange={(e) => setQuando(e.target.value)} /></label>
      <label className="grid gap-1 text-sm"><span className="rotulo">Como</span>
        <select className={campo} value={modo} onChange={(e) => setModo(e.target.value)}><option value="presencial">presencial</option><option value="online">online</option></select>
      </label>
      <button className="btn btn-primario disabled:opacity-60" disabled={pendente}>{pendente ? "Enviando…" : primeira ? "Aceitar plano e agendar" : "Agendar sessão"}</button>
      <Retorno r={r} carimbo="Agendado" />
    </form>
  );
}

export function Registrar({ sessaoId }: { sessaoId: string }) {
  const [texto, setTexto] = useState("");
  const [r, setR] = useState<Resultado | null>(null);
  const [pendente, iniciar] = useTransition();
  if (r?.ok) return <Retorno r={r} carimbo="Registrado" />;
  return (
    <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); iniciar(async () => setR(await registrarSessao(sessaoId, texto))); }}>
      <label className="sr-only" htmlFor={`reg-${sessaoId}`}>O que foi feito na sessão</label>
      <textarea id={`reg-${sessaoId}`} rows={2} required minLength={3} className="rounded-[10px] border border-borda bg-white px-3 py-2 text-base focus:outline-none focus-visible:border-azul" placeholder="O que foi feito e como o aluno respondeu" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <div className="flex items-center gap-3">
        <button className="btn btn-secundario disabled:opacity-60" disabled={pendente}>{pendente ? "Salvando…" : "Registrar sessão"}</button>
        <Retorno r={r} carimbo="Registrado" />
      </div>
    </form>
  );
}

export function Concluir({ pedidoId }: { pedidoId: string }) {
  const [r, setR] = useState<Resultado | null>(null);
  const [pendente, iniciar] = useTransition();
  if (r?.ok) return <Retorno r={r} carimbo="Concluído" />;
  const fechar = (fechou: boolean) => iniciar(async () => setR(await concluirReforco(pedidoId, fechou)));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-suave">Mini-avaliação de saída:</span>
      <button type="button" className="btn btn-secundario disabled:opacity-60" disabled={pendente} onClick={() => fechar(true)}>Dominou a habilidade</button>
      <button type="button" className="btn btn-secundario disabled:opacity-60" disabled={pendente} onClick={() => fechar(false)}>Ainda não</button>
      <Retorno r={r} carimbo="Concluído" />
    </div>
  );
}

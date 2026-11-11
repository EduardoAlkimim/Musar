"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PASSOS, type Passo } from "@/lib/demo";

/**
 * Barra da demonstração guiada, no rodapé: passo, o que fazer e para onde ir.
 * Fica baixa para não cobrir a tela; "O que dizer" abre o texto para quem apresenta.
 * Destaca na tela o elemento do passo e leva até ele.
 */
export function GuiaDemo({ passo, total, estatico = false }: { passo: Passo; total: number; estatico?: boolean }) {
  // Na versão estática (GitHub Pages) cada passo é a própria tela com ?passo=N; na local, a rota /demo/passo/N entra na conta.
  const irPara = (n: number) => (estatico ? `${PASSOS.find((p) => p.n === n)!.rota}?passo=${n}` : `/demo/passo/${n}`);
  const Ancora = estatico ? Link : "a";
  const [falar, setFalar] = useState(false);
  const caminho = usePathname();
  const semBarra = (c: string) => c.replace(/\/$/, "") || "/";
  const naTelaDoPasso = semBarra(caminho) === semBarra(passo.rota);

  useEffect(() => {
    if (!passo.alvo || !naTelaDoPasso) return;
    const el = document.querySelector<HTMLElement>(`[data-demo="${passo.alvo}"]`);
    if (!el) return;
    el.classList.add("demo-alvo");
    // Só rola se o ponto estiver fora da tela: a frase do topo é o que mais importa mostrar.
    const t = setTimeout(() => {
      const r = el.getBoundingClientRect();
      const visivel = r.top >= 90 && r.bottom <= window.innerHeight - 150;
      if (!visivel) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 450);
    return () => {
      clearTimeout(t);
      el.classList.remove("demo-alvo");
    };
  }, [passo.alvo, naTelaDoPasso]);

  return (
    <aside aria-label="Demonstração guiada" className="fixed inset-x-0 bottom-0 z-40 border-t border-marinho/20 bg-marinho text-white shadow-[0_-18px_40px_-24px_rgba(33,31,28,.6)]">
      <div className="h-1 bg-white/15">
        <div className="h-full bg-ouro transition-[width] duration-500" style={{ width: `${(passo.n / total) * 100}%` }} />
      </div>
      {falar && (
        <div className="mx-auto max-w-[76rem] border-b border-white/15 px-5 py-3 sm:px-8">
          <p className="max-w-[80ch] font-titulo text-[1.08rem] italic leading-snug text-white/90">“{passo.mensagem}”</p>
        </div>
      )}
      <div className="mx-auto flex max-w-[76rem] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3 sm:px-8">
        <div className="min-w-0 flex-1 basis-[22rem]">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-white/60">
            Passo {passo.n} de {total} · {passo.pessoa}, {passo.papel.toLowerCase()}
          </p>
          <h2 className="mt-0.5 truncate font-titulo text-[1.1rem] leading-snug text-white">{passo.titulo}</h2>
          <p className="mt-1 text-[0.9rem] text-white/85">
            <span className="mr-1.5 rounded-[6px] bg-ouro px-1.5 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-marinho">Faça</span>
            {naTelaDoPasso ? passo.fazer : <>Você saiu da tela deste passo. <Ancora href={estatico ? irPara(passo.n) : passo.rota} className="underline underline-offset-4">Voltar para ela</Ancora></>}
          </p>
        </div>
        <nav aria-label="Passos da demonstração" className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setFalar(!falar)} aria-expanded={falar} className="min-h-10 rounded-[10px] border border-white/30 px-3 text-sm hover:border-white">
            {falar ? "Esconder fala" : "O que dizer"}
          </button>
          <Ancora href={passo.n > 1 ? irPara(passo.n - 1) : "/demo"} className="inline-flex min-h-10 items-center rounded-[10px] border border-white/30 px-3 text-sm hover:border-white">
            {passo.n > 1 ? "← Anterior" : "Roteiro"}
          </Ancora>
          {passo.n < total ? (
            <Ancora href={irPara(passo.n + 1)} className="inline-flex min-h-10 items-center rounded-[10px] bg-white px-4 text-sm font-semibold text-marinho hover:bg-[#f7fafc]">Próximo passo →</Ancora>
          ) : (
            <Ancora href={estatico ? "/demo" : "/demo/sair"} className="inline-flex min-h-10 items-center rounded-[10px] bg-white px-4 text-sm font-semibold text-marinho hover:bg-[#f7fafc]">Encerrar demonstração</Ancora>
          )}
        </nav>
      </div>
    </aside>
  );
}

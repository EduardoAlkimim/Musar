"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Passo } from "@/lib/demo";

/**
 * Barra da demonstração guiada, no rodapé: passo, o que fazer e para onde ir.
 * Fica baixa para não cobrir a tela; "O que dizer" abre o texto para quem apresenta.
 * Destaca na tela o elemento do passo e leva até ele.
 */
export function GuiaDemo({ passo, total }: { passo: Passo; total: number }) {
  const [falar, setFalar] = useState(false);
  const caminho = usePathname();
  const naTelaDoPasso = caminho === passo.rota;

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
    <aside aria-label="Demonstração guiada" className="fixed inset-x-0 bottom-0 z-40 border-t border-tinta/20 bg-tinta text-folha shadow-[0_-18px_40px_-24px_rgba(33,31,28,.6)]">
      <div className="h-1 bg-folha/15">
        <div className="h-full bg-marca transition-[width] duration-500" style={{ width: `${(passo.n / total) * 100}%` }} />
      </div>
      {falar && (
        <div className="mx-auto max-w-[76rem] border-b border-folha/15 px-5 py-3 sm:px-8">
          <p className="max-w-[80ch] font-serif text-[1.08rem] italic leading-snug text-folha/90">“{passo.mensagem}”</p>
        </div>
      )}
      <div className="mx-auto flex max-w-[76rem] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3 sm:px-8">
        <div className="min-w-0 flex-1 basis-[22rem]">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-folha/60">
            Passo {passo.n} de {total} · {passo.pessoa}, {passo.papel.toLowerCase()}
          </p>
          <h2 className="mt-0.5 truncate font-serif text-[1.2rem] leading-snug">{passo.titulo}</h2>
          <p className="mt-1 text-[0.9rem] text-folha/85">
            <span className="mr-1.5 rounded-[2px] bg-marca px-1.5 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-tinta">Faça</span>
            {naTelaDoPasso ? passo.fazer : <>Você saiu da tela deste passo. <a href={passo.rota} className="underline underline-offset-4">Voltar para ela</a></>}
          </p>
        </div>
        <nav aria-label="Passos da demonstração" className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setFalar(!falar)} aria-expanded={falar} className="min-h-10 rounded-[3px] border border-folha/30 px-3 text-sm hover:border-folha">
            {falar ? "Esconder fala" : "O que dizer"}
          </button>
          <a href={passo.n > 1 ? `/demo/passo/${passo.n - 1}` : "/demo"} className="inline-flex min-h-10 items-center rounded-[3px] border border-folha/30 px-3 text-sm hover:border-folha">
            {passo.n > 1 ? "← Anterior" : "Roteiro"}
          </a>
          {passo.n < total ? (
            <a href={`/demo/passo/${passo.n + 1}`} className="inline-flex min-h-10 items-center rounded-[3px] bg-folha px-4 text-sm font-semibold text-tinta hover:bg-papel">Próximo passo →</a>
          ) : (
            <a href="/demo/sair" className="inline-flex min-h-10 items-center rounded-[3px] bg-folha px-4 text-sm font-semibold text-tinta hover:bg-papel">Encerrar demonstração</a>
          )}
        </nav>
      </div>
    </aside>
  );
}

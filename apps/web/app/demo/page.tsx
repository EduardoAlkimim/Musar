import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayCircle, RotateCcw } from "lucide-react";
import { Marca } from "@/components/marca";
import { demoLigado, PASSOS } from "@/lib/demo";
import { iniciais } from "@/lib/formato";

export const metadata: Metadata = { title: "Demonstração" };

export default async function Demo({ searchParams }: { searchParams: Promise<{ reiniciada?: string; erro?: string }> }) {
  if (!demoLigado()) notFound();
  const { reiniciada, erro } = await searchParams;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(22rem,30rem)_1fr]">
      <aside className="relative overflow-hidden bg-marinho px-8 py-10 text-white lg:min-h-dvh lg:px-10 lg:py-14">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-azul/40 blur-3xl" />
        <div className="relative">
          <Marca variante="clara" />
          <p className="mt-14 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ouro">Demonstração guiada · 7 passos · 10 minutos</p>
          <h1 className="mt-3 text-[2.2rem] font-semibold leading-tight text-white">Gestão escolar que encaminha cada aluno para o reforço certo.</h1>
          <p className="mt-4 text-white/70">
            Uma história real em sete telas: a direção enxerga a escola, indica o professor de reforço, a professora acompanha a turma, a família aprova e o reforço começa.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="/demo/passo/1" className="btn btn-ouro h-12 px-5 text-base"><PlayCircle className="size-5" /> Começar a demonstração</a>
            <form action="/demo/reiniciar" method="post">
              <button className="btn h-12 border border-white/25 px-5 text-base text-white hover:bg-white/10"><RotateCcw className="size-4" /> Reiniciar os dados</button>
            </form>
          </div>
          {reiniciada && <p role="status" className="mt-4 text-sm text-white/80"><span className="carimbo mr-2">Pronto</span>Escola de demonstração do zero, pronta para apresentar.</p>}
          {erro && <p role="alert" className="mt-4 text-sm text-[#fecaca]">Não foi possível reiniciar. A API está rodando com DEMO_MODE=1?</p>}
          <p className="mt-12 text-xs text-white/50">Escola fictícia com 96 alunos, 4 turmas de 6º ano e dois meses de atividades. Os números são calculados pelas regras do produto.</p>
        </div>
      </aside>

      <main className="px-5 py-10 sm:px-10 lg:py-14">
        <h2 className="text-[1.3rem] font-semibold">Roteiro</h2>
        <ol className="mt-5 space-y-3">
          {PASSOS.map((p) => (
            <li key={p.n}>
              <a href={`/demo/passo/${p.n}`} className="card entra group flex items-center gap-4 p-4 transition-shadow hover:shadow-[0_14px_30px_-20px_rgba(20,49,80,.5)]">
                <span className="num grid size-10 shrink-0 place-items-center rounded-full bg-azul-fundo font-titulo text-sm font-bold text-azul">{p.n}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-marinho group-hover:text-azul">{p.titulo}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-sm text-suave">
                    <span className="grid size-5 place-items-center rounded-full bg-ouro-claro text-[0.55rem] font-bold text-[#8a6417]">{iniciais(p.pessoa)}</span>
                    {p.pessoa} · {p.papel}
                  </span>
                </span>
                <span className="text-sm font-semibold text-azul opacity-0 transition-opacity group-hover:opacity-100">Ir →</span>
              </a>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}

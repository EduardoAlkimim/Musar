import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Marca } from "@/components/marca";
import { demoLigado, PASSOS } from "@/lib/demo";

export const metadata: Metadata = { title: "Demonstração" };

const CICLO = ["Prova", "Diagnóstico", "Alerta", "Reforço", "Evolução"];

export default async function Demo({ searchParams }: { searchParams: Promise<{ reiniciada?: string; erro?: string }> }) {
  if (!demoLigado()) notFound();
  const { reiniciada, erro } = await searchParams;

  return (
    <main className="mx-auto grid min-h-dvh max-w-[76rem] grid-cols-1 gap-14 px-5 py-12 sm:px-8 lg:grid-cols-12 lg:py-16">
      <section className="entra lg:col-span-5">
        <Marca />
        <p className="rotulo mt-12">Demonstração guiada · 7 passos · 10 minutos</p>
        <h1 className="mt-4 text-[2.9rem] sm:text-[3.6rem]">
          Do alerta ao reforço, <span className="marcado">sem ninguém precisar pedir.</span>
        </h1>
        <p className="mt-6 max-w-[44ch] text-[1.05rem] text-grafite">
          Você vai ver a mesma história pelos olhos de cada pessoa da escola: a professora percebe a queda, a mãe aprova, o reforço começa e a coordenação acompanha.
        </p>

        <ol aria-label="O ciclo" className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-3 font-mono text-[0.78rem] uppercase tracking-[0.1em]">
          {CICLO.map((c, i) => (
            <li key={c} className="flex items-center gap-2">
              <span className={i === 2 ? "rounded-[2px] bg-escola px-2 py-1 text-folha" : "rounded-[2px] border border-pauta-forte px-2 py-1"}>{c}</span>
              {i < CICLO.length - 1 && <span aria-hidden className="text-grafite">→</span>}
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <a href="/demo/passo/1" className="botao-tinta">Começar a demonstração</a>
          <form action="/demo/reiniciar" method="post">
            <button className="botao-linha">Reiniciar os dados</button>
          </form>
        </div>
        {reiniciada && <p role="status" className="mt-4 inline-flex items-center gap-3"><span className="carimbo">Pronto</span><span className="text-sm text-grafite">Escola de demonstração do zero, pronta para apresentar.</span></p>}
        {erro && <p role="alert" className="mt-4 text-sm text-alerta">Não foi possível reiniciar. A API está rodando com DEMO_MODE=1?</p>}
        <p className="mt-10 max-w-[46ch] text-xs text-grafite">
          Escola fictícia, com 96 alunos, quatro turmas de 6º ano e dois meses de atividades. Os números são calculados pelas mesmas regras do produto.
        </p>
      </section>

      <nav aria-label="Roteiro" className="folha pauta self-start px-6 pb-4 pt-8 sm:px-10 lg:col-span-7">
        <h2 className="font-serif text-[1.8rem] leading-[2rem]">Roteiro</h2>
        <ol className="entra-lista">
          {PASSOS.map((p) => (
            <li key={p.n}>
              <a href={`/demo/passo/${p.n}`} className="group grid grid-cols-[2rem_1fr_auto] items-baseline gap-x-3 py-[1rem] leading-[2rem]">
                <span className="num font-mono text-sm text-grafite">{String(p.n).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block font-semibold group-hover:text-escola">{p.titulo}</span>
                  <span className="block truncate font-serif text-[1.08rem] italic text-grafite">{p.pessoa} · {p.papel}</span>
                </span>
                <span className="font-mono text-xs text-grafite opacity-0 transition-opacity group-hover:opacity-100">ir →</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </main>
  );
}

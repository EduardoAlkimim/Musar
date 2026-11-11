import Link from "next/link";
import { demo } from "@escola/domain";
import { Marca } from "@/components/marca";

const s = demo.DEMO_SUMMARY;
const pior = [...demo.REPORT.questions].sort((a, b) => a.pctCorrect - b.pctCorrect)[0]!;

const capitulos = [
  { href: "/professor", quem: "Professora", frase: s?.sentence ?? "Ninguém precisa de reforço hoje", pagina: 3 },
  { href: "/professor/prova", quem: "Correção da prova", frase: `A questão ${pior.number} foi errada por ${Math.round((1 - pior.pctCorrect) * 100)}% da turma`, pagina: 7 },
  { href: "/reforco", quem: "Professor de reforço", frase: "2 alunos novos chegaram com diagnóstico pronto", pagina: 12 },
  { href: "/coordenacao", quem: "Coordenação", frase: "O 6º C caiu em Matemática neste bimestre", pagina: 16 },
  { href: "/familia", quem: "Família", frase: "João precisa de apoio em frações", pagina: 21 },
  { href: "/aluno", quem: "Aluno", frase: "Seu próximo passo leva 10 minutos", pagina: 24 },
];

export default function Sumario() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-[76rem] grid-cols-1 gap-12 px-5 py-12 sm:px-8 lg:grid-cols-12 lg:py-20">
      <section className="entra lg:col-span-5">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-grafite">Escola de demonstração · 2026</p>
        <h1 className="mt-6"><Marca grande /></h1>
        <p className="mt-8 max-w-[34ch] font-serif text-[1.55rem] leading-snug">
          Avisa <span className="marcado">antes</span> de o problema virar nota baixa.
        </p>
        <p className="mt-5 max-w-[46ch] text-grafite">
          Corrige a prova, encontra a habilidade que ficou para trás e encaminha o aluno para o reforço certo. Sem ninguém precisar pedir.
        </p>
        <div className="adesivo mt-10 max-w-[30ch] p-5 text-[0.95rem] leading-relaxed">
          Escolha um capítulo para ver a plataforma do ponto de vista de cada pessoa da escola.
        </div>
      </section>

      <nav aria-label="Sumário" className="folha pauta self-start px-6 pb-6 pt-8 sm:px-10 lg:col-span-7">
        <h2 className="mb-2 font-serif text-[2rem] leading-[2rem]">Sumário</h2>
        <ol className="entra-lista">
          {capitulos.map((c, i) => (
            <li key={c.href}>
              <Link href={c.href} className="group grid grid-cols-[2rem_1fr_auto] items-baseline gap-x-3 py-[1rem] leading-[2rem]">
                <span className="num font-mono text-sm text-grafite">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block font-semibold group-hover:text-escola">{c.quem}</span>
                  <span className="block truncate font-serif text-[1.15rem] italic text-grafite">{c.frase}</span>
                </span>
                <span className="num font-mono text-sm text-grafite">p. {c.pagina}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </main>
  );
}

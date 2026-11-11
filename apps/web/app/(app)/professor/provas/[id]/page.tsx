import Link from "next/link";
import type { Metadata } from "next";
import clsx from "clsx";
import { Check } from "@phosphor-icons/react/dist/ssr";
import type { QuestionFlag, QuestionStats } from "@escola/domain";
import { CodigoBncc, Decisao, Pagina, TituloSecao } from "@/components/caderno";
import { api } from "@/lib/api";
import { dataCurta, decimal, letra, pct } from "@/lib/formato";

export const metadata: Metadata = { title: "Prova corrigida" };

interface Relatorio {
  prova: { id: string; titulo: string; data: string; turma: string; materia: string };
  questoes: { id: string; number: number; statement: string; options: string[]; correct: number; skill: string; stats: QuestionStats }[];
  alunos: { studentId: string; nome: string; correct: number; total: number; score: number; bySkill: Record<string, { correct: number; total: number }> }[];
  media: number;
  habilidades: Record<string, { codigo: string; nome: string }>;
}

const EXPLICA: Record<QuestionFlag, { titulo: string; texto: string }> = {
  "todos-erram": { titulo: "Quase todos erraram", texto: "Vale retomar o conteúdo em sala antes de seguir." },
  "nao-discrimina": { titulo: "Não separa quem sabe de quem não sabe", texto: "Alunos com bom desempenho na prova erraram tanto quanto os outros. O enunciado pode estar ambíguo." },
  "muitos-em-branco": { titulo: "Muitos em branco", texto: "Pode ter faltado tempo ou o enunciado ficou confuso." },
};

export default async function Prova({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await api<Relatorio>(`/provas/${id}/relatorio`);
  const hab = (k: string) => r.habilidades[k] ?? { codigo: "", nome: "" };

  if (r.alunos.length === 0) {
    return (
      <Pagina>
        <Decisao sobre={`${r.prova.titulo} · ${r.prova.turma}`} frase="Ainda não há respostas nesta prova." detalhe="Lance as respostas dos alunos e a correção sai na hora, pelo gabarito.">
          <Link href={`/professor/provas/${id}/respostas`} className="botao-tinta">Lançar respostas</Link>
        </Decisao>
      </Pagina>
    );
  }

  const stats = r.questoes.map((q) => q.stats);
  const pior = [...stats].sort((a, b) => a.pctCorrect - b.pctCorrect)[0]!;
  const ambigua = stats.filter((q) => q.flags.includes("nao-discrimina")).sort((a, b) => a.discrimination - b.discrimination)[0];
  const porHabilidade = Object.keys(r.habilidades).map((k) => {
    let c = 0, t = 0;
    for (const a of r.alunos) { c += a.bySkill[k]?.correct ?? 0; t += a.bySkill[k]?.total ?? 0; }
    return { k, taxa: t ? c / t : 0 };
  });

  return (
    <Pagina>
      <Decisao
        sobre={`${r.prova.titulo} · ${r.prova.turma} · ${dataCurta(r.prova.data)}`}
        frase={pior.pctCorrect < 0.5 ? <>A questão {pior.number} foi errada por {pct(1 - pior.pctCorrect)} da turma.</> : <>A turma acertou {pct(r.alunos.reduce((s, a) => s + a.correct / a.total, 0) / r.alunos.length)} da prova.</>}
        detalhe={
          <>
            {pior.topDistractor?.meaning && <>A resposta errada mais marcada na questão {pior.number} foi a {letra(pior.topDistractor.option)}: quem a escolheu <em>{pior.topDistractor.meaning}</em>. </>}
            {ambigua && <>A questão {ambigua.number} pode estar ambígua.</>}
          </>
        }
      >
        <a href={`#q${pior.number}`} className="botao-tinta">Ver a questão {pior.number}</a>
        {ambigua && <a href={`#q${ambigua.number}`} className="botao-linha">Revisar a questão {ambigua.number}</a>}
        <Link href={`/professor/provas/${id}/respostas`} className="botao-linha">Lançar ou corrigir respostas</Link>
      </Decisao>

      <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-pauta bg-pauta sm:grid-cols-4">
        {[["Média da turma", decimal(r.media)], ["Alunos", String(r.alunos.length)], ["Questões", String(r.questoes.length)], ["Correção", "gabarito"]].map(([k, v]) => (
          <div key={k} className="bg-folha px-5 py-4">
            <dt className="rotulo">{k}</dt>
            <dd className="num mt-1 font-serif text-[2rem] leading-none">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-grafite">A correção é feita pelo gabarito, sem IA: as mesmas respostas sempre dão a mesma nota.</p>

      <section className="mt-14" aria-labelledby="hab">
        <TituloSecao nota="Acertos da turma por habilidade"><span id="hab">Por habilidade</span></TituloSecao>
        <ul className="grid gap-4 sm:grid-cols-3">
          {porHabilidade.map(({ k, taxa }) => (
            <li key={k} className="folha p-5">
              <p className="font-semibold">{hab(k).nome}</p>
              <CodigoBncc codigo={hab(k).codigo} />
              <p className="num mt-3 font-serif text-[2.4rem] leading-none">{pct(taxa)}</p>
              <div className="mt-3 h-1.5 bg-areia"><div className="h-full bg-escola" style={{ width: pct(taxa) }} /></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="questoes">
        <TituloSecao nota="Barras = quantos alunos marcaram cada alternativa"><span id="questoes">Questão por questão</span></TituloSecao>
        <ol className="divide-y divide-pauta">
          {r.questoes.map((q) => (
            <Questao key={q.id} q={q} hab={hab(q.skill)} />
          ))}
        </ol>
      </section>

      <section className="mt-14" aria-labelledby="notas">
        <TituloSecao nota="Nota de 0 a 10"><span id="notas">Notas da turma</span></TituloSecao>
        <div className="folha overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-pauta text-left">
                <th className="px-4 py-3 font-normal"><span className="rotulo">Aluno</span></th>
                <th className="px-4 py-3 text-right font-normal"><span className="rotulo">Acertos</span></th>
                <th className="px-4 py-3 text-right font-normal"><span className="rotulo">Nota</span></th>
                <th className="px-4 py-3 font-normal"><span className="rotulo">Errou mais em</span></th>
              </tr>
            </thead>
            <tbody>
              {[...r.alunos].sort((a, b) => a.score - b.score).map((a) => {
                const fraca = Object.entries(a.bySkill).filter(([, v]) => v.correct < v.total).sort((x, y) => x[1].correct / x[1].total - y[1].correct / y[1].total)[0];
                return (
                  <tr key={a.studentId} className="border-b border-pauta/70 last:border-0">
                    <td className="px-4 py-2.5">{a.nome}</td>
                    <td className="num px-4 py-2.5 text-right font-mono">{a.correct}/{a.total}</td>
                    <td className="num px-4 py-2.5 text-right font-serif text-[1.1rem]">{decimal(a.score)}</td>
                    <td className="px-4 py-2.5 text-grafite">{fraca ? hab(fraca[0]).nome : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </Pagina>
  );
}

function Questao({ q, hab }: { q: Relatorio["questoes"][number]; hab: { codigo: string; nome: string } }) {
  const st = q.stats;
  const max = Math.max(...st.optionCounts, 1);
  return (
    <li id={`q${q.number}`} className="grid scroll-mt-28 gap-6 py-7 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <p className="flex items-baseline gap-3">
          <span className="num font-serif text-[2rem] leading-none">{q.number}</span>
          <span className="text-sm text-grafite">{hab.nome} · <CodigoBncc codigo={hab.codigo} /></span>
        </p>
        <p className="mt-3 font-serif text-[1.15rem] leading-snug">{q.statement}</p>
        {st.flags.map((f) => (
          <div key={f} className="mt-4 border-l-2 border-tinta pl-3 text-sm">
            <p className="font-semibold">{EXPLICA[f].titulo}</p>
            <p className="text-grafite">{EXPLICA[f].texto}</p>
          </div>
        ))}
      </div>
      <div className="lg:col-span-7">
        <ul className="space-y-1.5">
          {q.options.map((o, i) => {
            const n = st.optionCounts[i] ?? 0;
            const certa = i === q.correct;
            return (
              <li key={i} className="grid grid-cols-[1.5rem_minmax(0,11rem)_1fr_2rem] items-center gap-3 text-sm">
                <span className={clsx("font-mono", certa && "font-bold text-escola")}>{letra(i)}</span>
                <span className="truncate" title={o}>{o}</span>
                <span className="relative h-6">
                  <span className={clsx("absolute inset-y-0 left-0 flex items-center rounded-[1px] pl-2", certa ? "bg-escola text-folha" : "bg-areia")} style={{ width: `${Math.max(2, (n / max) * 100)}%` }}>
                    {certa && <Check size={14} weight="bold" aria-label="alternativa correta" />}
                  </span>
                </span>
                <span className="num text-right font-mono text-grafite">{n}</span>
              </li>
            );
          })}
        </ul>
        {st.topDistractor?.meaning && (
          <p className="mt-3 text-sm text-grafite">Quem marcou <strong className="font-mono text-tinta">{letra(st.topDistractor.option)}</strong> provavelmente {st.topDistractor.meaning}.</p>
        )}
        <p className="num mt-2 font-mono text-xs text-grafite">
          {pct(st.pctCorrect)} de acerto · discriminação {decimal(st.discrimination, 2)}{st.blank ? ` · ${st.blank} em branco` : ""}
        </p>
      </div>
    </li>
  );
}

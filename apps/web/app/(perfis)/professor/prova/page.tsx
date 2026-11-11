import type { Metadata } from "next";
import clsx from "clsx";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { demo, type QuestionFlag, type QuestionStats } from "@escola/domain";
import { CodigoBncc, Decisao, Pagina, SeloDemo, TituloSecao } from "@/components/caderno";
import { dataCurta, decimal, letra, pct } from "@/lib/formato";
import { nomeHabilidade } from "@/lib/dados";

export const metadata: Metadata = { title: "Prova corrigida" };

const EXPLICA: Record<QuestionFlag, { titulo: string; texto: string }> = {
  "todos-erram": { titulo: "Quase todos erraram", texto: "Vale retomar o conteúdo em sala antes de seguir." },
  "nao-discrimina": { titulo: "Não separa quem sabe de quem não sabe", texto: "Alunos com bom domínio erraram tanto quanto os outros. O enunciado pode estar ambíguo." },
  "muitos-em-branco": { titulo: "Muitos em branco", texto: "Pode ter faltado tempo ou o enunciado ficou confuso." },
};

export default function Prova() {
  const prova = demo.ASSESSMENT;
  const rel = demo.REPORT;
  const pior = [...rel.questions].sort((a, b) => a.pctCorrect - b.pctCorrect)[0]!;
  const ambigua = rel.questions.filter((q) => q.flags.includes("nao-discrimina")).sort((a, b) => a.discrimination - b.discrimination)[0];
  const alunos = demo.studentsOfClass(prova.classId);
  const porHabilidade = demo.SKILLS.map((s) => {
    let c = 0, t = 0;
    for (const r of rel.students) { c += r.bySkill[s.code]?.correct ?? 0; t += r.bySkill[s.code]?.total ?? 0; }
    return { skill: s, taxa: t ? c / t : null };
  }).filter((x) => x.taxa !== null);

  return (
    <Pagina>
      <Decisao
        sobre={`${prova.title} · 6º ano B · ${dataCurta(prova.date)}`}
        frase={<>A questão {pior.number} foi errada por {pct(1 - pior.pctCorrect)} da turma.</>}
        detalhe={
          <>
            {pior.topDistractor?.meaning && (
              <>A resposta errada mais marcada foi a {letra(pior.topDistractor.option)}: quem a escolheu <em>{pior.topDistractor.meaning}</em>. </>
            )}
            {ambigua && <>A questão {ambigua.number} pode estar ambígua.</>}
          </>
        }
      >
        <a href={`#q${pior.number}`} className="botao-tinta">Ver a questão {pior.number}</a>
        {ambigua && <a href={`#q${ambigua.number}`} className="botao-linha">Revisar a questão {ambigua.number}</a>}
      </Decisao>

      <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-pauta bg-pauta sm:grid-cols-4">
        {[
          ["Média da turma", decimal(rel.average)],
          ["Alunos", String(rel.students.length)],
          ["Questões", String(prova.questions.length)],
          ["Correção", "gabarito"],
        ].map(([k, v]) => (
          <div key={k} className="bg-folha px-5 py-4">
            <dt className="rotulo">{k}</dt>
            <dd className="num mt-1 font-serif text-[2rem] leading-none">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-grafite">
        A correção é feita pelo gabarito, sem IA: as mesmas respostas sempre dão a mesma nota.
      </p>

      <section className="mt-14" aria-labelledby="hab">
        <TituloSecao nota="Acertos da turma por habilidade"><span id="hab">Por habilidade</span></TituloSecao>
        <ul className="grid gap-4 sm:grid-cols-3">
          {porHabilidade.map(({ skill, taxa }) => (
            <li key={skill.code} className="folha p-5">
              <p className="font-semibold">{skill.shortName}</p>
              <CodigoBncc codigo={skill.code} />
              <p className="num mt-3 font-serif text-[2.4rem] leading-none">{pct(taxa!)}</p>
              <div className="mt-3 h-1.5 bg-areia"><div className="h-full bg-escola" style={{ width: pct(taxa!) }} /></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="questoes">
        <TituloSecao nota="Barras = quantos alunos marcaram cada alternativa">
          <span id="questoes">Questão por questão</span>
        </TituloSecao>
        <ol className="divide-y divide-pauta">
          {prova.questions.map((q) => {
            const st = rel.questions.find((s) => s.questionId === q.id)!;
            return <Questao key={q.id} enunciado={q.statement} opcoes={q.options} correta={q.correct} st={st} />;
          })}
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
              {[...rel.students].sort((a, b) => a.score - b.score).map((r) => {
                const fraca = Object.entries(r.bySkill).filter(([, v]) => v.correct < v.total).sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))[0];
                return (
                  <tr key={r.studentId} className="border-b border-pauta/70 last:border-0">
                    <td className="px-4 py-2.5">{alunos.find((a) => a.id === r.studentId)?.name}</td>
                    <td className="num px-4 py-2.5 text-right font-mono">{r.correct}/{r.total}</td>
                    <td className="num px-4 py-2.5 text-right font-serif text-[1.1rem]">{decimal(r.score)}</td>
                    <td className="px-4 py-2.5 text-grafite">{fraca ? nomeHabilidade(fraca[0]) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <SeloDemo />
    </Pagina>
  );
}

function Questao({ enunciado, opcoes, correta, st }: { enunciado: string; opcoes: string[]; correta: number; st: QuestionStats }) {
  const max = Math.max(...st.optionCounts, 1);
  return (
    <li id={`q${st.number}`} className="grid scroll-mt-28 gap-6 py-7 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <p className="flex items-baseline gap-3">
          <span className="num font-serif text-[2rem] leading-none">{st.number}</span>
          <span className="text-sm text-grafite">{nomeHabilidade(st.skill)} · <CodigoBncc codigo={st.skill} /></span>
        </p>
        <p className="mt-3 font-serif text-[1.15rem] leading-snug">{enunciado}</p>
        {st.flags.map((f) => (
          <div key={f} className="mt-4 border-l-2 border-tinta pl-3 text-sm">
            <p className="font-semibold">{EXPLICA[f].titulo}</p>
            <p className="text-grafite">{EXPLICA[f].texto}</p>
          </div>
        ))}
      </div>
      <div className="lg:col-span-7">
        <ul className="space-y-1.5">
          {opcoes.map((o, i) => {
            const n = st.optionCounts[i] ?? 0;
            const certa = i === correta;
            return (
              <li key={i} className="grid grid-cols-[1.5rem_minmax(0,11rem)_1fr_2rem] items-center gap-3 text-sm">
                <span className={clsx("font-mono", certa && "font-bold text-escola")}>{letra(i)}</span>
                <span className="truncate" title={o}>{o}</span>
                <span className="relative h-6">
                  <span
                    className={clsx("absolute inset-y-0 left-0 flex items-center rounded-[1px] pl-2", certa ? "bg-escola text-folha" : "bg-areia")}
                    style={{ width: `${Math.max(2, (n / max) * 100)}%` }}
                  >
                    {certa && <Check size={14} weight="bold" aria-label="alternativa correta" />}
                  </span>
                </span>
                <span className="num text-right font-mono text-grafite">{n}</span>
              </li>
            );
          })}
        </ul>
        {st.topDistractor?.meaning && (
          <p className="mt-3 text-sm text-grafite">
            Quem marcou <strong className="font-mono text-tinta">{letra(st.topDistractor.option)}</strong> provavelmente {st.topDistractor.meaning}.
          </p>
        )}
        <p className="num mt-2 font-mono text-xs text-grafite">
          {pct(st.pctCorrect)} de acerto · discriminação {decimal(st.discrimination, 2)}{st.blank ? ` · ${st.blank} em branco` : ""}
        </p>
      </div>
    </li>
  );
}

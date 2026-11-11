import type { Metadata } from "next";
import clsx from "clsx";
import { demo } from "@escola/domain";
import { Decisao, Pagina, SeloDemo, TituloSecao } from "@/components/caderno";
import { Confirmar } from "@/components/confirmar";
import { dataCurta, decimal } from "@/lib/formato";

export const metadata: Metadata = { title: "Painel da escola" };

const diasDesde = (iso: string) =>
  Math.round((Date.parse(demo.DEMO_TODAY) - Date.parse(iso)) / 86_400_000);

export default function Coordenacao() {
  const linhas = demo.CLASS_SUBJECT_AVG;
  const materias = [...new Set(linhas.map((l) => l.subject))];
  const mat = linhas.filter((l) => l.subject === "Matemática");
  const queda = [...mat].sort((a, b) => (a.avg - a.prev) - (b.avg - b.prev))[0]!;
  const turmaQueda = demo.classById(queda.classId)!;
  const parado = demo.TEACHERS_ACTIVITY.filter((t) => diasDesde(t.lastActivity) > 14);
  const ranking = [...linhas].sort((a, b) => b.avg - a.avg);

  const media = (ids: string[], skill: string) => {
    const alunos = ids.flatMap((c) => demo.studentsOfClass(c));
    return Math.round(alunos.reduce((s, a) => s + (demo.MASTERY[a.id]?.[skill] ?? 0), 0) / alunos.length);
  };
  const comparacao = demo.SKILLS.map((s) => ({ s, marta: media(["6a", "6b"], s.code), jorge: media(["6c", "6d"], s.code) }));

  return (
    <Pagina>
      <Decisao
        sobre={`Beatriz Lemos · coordenação pedagógica · ${dataCurta(demo.DEMO_TODAY)}`}
        frase={<>O {turmaQueda.name} caiu {decimal(queda.prev - queda.avg)} {queda.prev - queda.avg >= 2 ? "pontos" : "ponto"} em Matemática neste bimestre.</>}
        detalhe={
          <>
            {demo.alertsForClass(queda.classId).length} alunos da turma têm alerta aberto.
            {parado[0] && <> O professor {parado[0].name} não lança atividade há {diasDesde(parado[0].lastActivity)} dias.</>}
          </>
        }
      >
        <Confirmar rotulo={`Agendar conversa com ${parado[0]?.name.split(" ")[0] ?? "o professor"}`} carimbo="Agendado" depois="Convite enviado para sex, 14 nov" />
        <a href="#comparar" className="botao-linha">Comparar professores</a>
      </Decisao>

      <div className="mt-16 grid gap-12 lg:grid-cols-12">
        <section className="lg:col-span-8" aria-labelledby="ranking">
          <TituloSecao nota="Média de 0 a 10 · seta = variação sobre o 3º bimestre"><span id="ranking">Turmas e matérias</span></TituloSecao>
          <div className="folha overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-pauta">
                  <th className="px-4 py-3 text-left font-normal"><span className="rotulo">Turma</span></th>
                  {materias.map((m) => (
                    <th key={m} className="px-3 py-3 text-right font-normal"><span className="rotulo">{m}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {demo.CLASSES.map((c) => (
                  <tr key={c.id} className="border-b border-pauta/70 last:border-0">
                    <th scope="row" className="px-4 py-3 text-left font-semibold">{c.name}</th>
                    {materias.map((m) => {
                      const l = linhas.find((x) => x.classId === c.id && x.subject === m)!;
                      const d = l.avg - l.prev;
                      const pos = ranking.indexOf(l);
                      return (
                        <td key={m} className={clsx("px-3 py-3 text-right", pos < 3 && "bg-escola-claro/60", pos >= ranking.length - 3 && "bg-areia/60")}>
                          <span className="num font-serif text-[1.15rem]">{decimal(l.avg)}</span>
                          <span className={clsx("num ml-1.5 font-mono text-[0.7rem]", d <= -0.3 ? "font-bold text-tinta" : "text-grafite")}>
                            {d >= 0 ? "↑" : "↓"}{decimal(Math.abs(d))}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-grafite">Fundo verde: 3 melhores médias da escola. Fundo areia: 3 menores.</p>
        </section>

        <aside className="lg:col-span-4" aria-labelledby="alertas">
          <TituloSecao><span id="alertas">Alertas da escola</span></TituloSecao>
          <ul className="entra-lista space-y-3">
            <li className="folha border-l-2 border-l-alerta p-4">
              <p className="font-semibold">{turmaQueda.name} em queda em Matemática</p>
              <p className="text-sm text-grafite">Média {decimal(queda.prev)} → {decimal(queda.avg)}</p>
            </li>
            {parado.map((p) => (
              <li key={p.name} className="folha p-4">
                <p className="font-semibold">{p.name} sem lançar atividade</p>
                <p className="text-sm text-grafite">Última em {dataCurta(p.lastActivity)} · {p.classes}</p>
              </li>
            ))}
            {demo.CLASSES.map((c) => {
              const n = new Set(demo.alertsForClass(c.id).map((a) => a.studentId)).size;
              return n > 0 && (
                <li key={c.id} className="folha p-4">
                  <p className="font-semibold">{n} aluno{n > 1 ? "s" : ""} do {c.name} com alerta</p>
                  <p className="text-sm text-grafite">{[...new Set(demo.alertsForClass(c.id).map((a) => demo.skillByCode(a.skill)?.shortName))].join(", ")}</p>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      <section id="comparar" className="mt-16 scroll-mt-28" aria-labelledby="comp">
        <TituloSecao nota="Domínio médio dos alunos, 0 a 100">
          <span id="comp">Mesmo conteúdo, professores diferentes</span>
        </TituloSecao>
        <div className="folha p-6">
          <div className="mb-5 flex gap-6 text-sm">
            <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-escola" /> Marta Ribeiro · 6º A e B</span>
            <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full border-2 border-tinta bg-folha" /> Jorge Tavares · 6º C e D</span>
          </div>
          <ul className="space-y-4">
            {comparacao.map(({ s, marta, jorge }) => (
              <li key={s.code} className="grid grid-cols-[9rem_1fr_5rem] items-center gap-4 text-sm sm:grid-cols-[12rem_1fr_6rem]">
                <span><span className="font-semibold">{s.shortName}</span> <span className="font-mono text-[0.7rem] text-grafite">{s.code}</span></span>
                <span className="relative h-6" role="img" aria-label={`${s.shortName}: Marta ${marta}, Jorge ${jorge}`}>
                  <span className="absolute inset-x-0 top-1/2 h-px bg-pauta-forte" />
                  {[25, 50, 75].map((t) => <span key={t} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-pauta-forte" style={{ left: `${t}%` }} />)}
                  <span className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-tinta/40" style={{ left: `${Math.min(marta, jorge)}%`, width: `${Math.abs(marta - jorge)}%` }} />
                  <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-escola" style={{ left: `${marta}%` }} />
                  <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-tinta bg-folha" style={{ left: `${jorge}%` }} />
                </span>
                <span className="num text-right font-mono text-xs text-grafite">{marta} · {jorge}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 grid grid-cols-[9rem_1fr_5rem] gap-4 sm:grid-cols-[12rem_1fr_6rem]" aria-hidden>
            <span />
            <span className="relative h-4 font-mono text-[0.68rem] text-grafite">
              {[0, 25, 50, 75, 100].map((t) => <span key={t} className="absolute -translate-x-1/2" style={{ left: `${t}%` }}>{t}</span>)}
            </span>
          </div>
        </div>
      </section>

      <SeloDemo />
    </Pagina>
  );
}

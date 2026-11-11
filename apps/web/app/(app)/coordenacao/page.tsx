import type { Metadata } from "next";
import clsx from "clsx";
import { Decisao, Pagina, TituloSecao } from "@/components/caderno";
import { Confirmar } from "@/components/confirmar";
import { api } from "@/lib/api";
import { dataCurta, decimal } from "@/lib/formato";
import { rodarDetector } from "../acoes";

export const metadata: Metadata = { title: "Painel da escola" };

interface Coord {
  bimestre: number;
  materias: string[];
  tabela: { turma: { id: string; nome: string }; materias: { materia: string; atual: number | null; anterior: number | null }[] }[];
  alertasPorTurma: { turma: string; alunos: number; habilidades: string[] }[];
  professores: { id: string; nome: string; turmas: string[]; materias: string[]; ultimaAtividade: string | null; diasSemAtividade: number | null }[];
  comparacao: { habilidade: { codigo: string; nome: string }; porProfessor: { professor: string; turmas: string[]; media: number | null }[] }[];
}

const MARCAS = ["bg-escola", "border-2 border-tinta bg-folha", "bg-tinta", "border-2 border-escola bg-folha"];

export default async function Coordenacao() {
  const c = await api<Coord>("/coordenacao");
  const celulas = c.tabela.flatMap((t) => t.materias.map((m) => ({ turma: t.turma.nome, ...m, delta: m.atual !== null && m.anterior !== null ? m.atual - m.anterior : null })));
  const queda = celulas.filter((x) => x.delta !== null).sort((a, b) => a.delta! - b.delta!)[0];
  const parados = c.professores.filter((p) => (p.diasSemAtividade ?? 0) > 14);
  const comNota = celulas.filter((x) => x.atual !== null).sort((a, b) => b.atual! - a.atual!);
  const topo = new Set(comNota.slice(0, 3));
  const fundo = new Set(comNota.slice(-3));
  const profsMat = c.comparacao[0]?.porProfessor ?? [];
  const caiu = queda && queda.delta! <= -0.3;

  return (
    <Pagina>
      <Decisao
        sobre={`Coordenação pedagógica · ${c.bimestre}º bimestre · ${dataCurta(new Date().toISOString().slice(0, 10))}`}
        frase={caiu ? <>O {queda.turma} caiu {decimal(-queda.delta!)} {-queda.delta! >= 2 ? "pontos" : "ponto"} em {queda.materia} neste bimestre.</> : "Nenhuma turma caiu neste bimestre."}
        detalhe={
          <>
            {c.alertasPorTurma.reduce((s, t) => s + t.alunos, 0)} alunos da escola têm alerta aberto ou estão no reforço.
            {parados[0] && <> {parados[0].nome} não lança atividade há {parados[0].diasSemAtividade} dias.</>}
          </>
        }
      >
        <Confirmar rotulo="Rodar o detector agora" carimbo="Atualizado" acao={rodarDetector} />
        <a href="#comparar" className="botao-linha">Comparar professores</a>
      </Decisao>

      <div className="mt-16 grid gap-12 lg:grid-cols-12">
        <section data-demo="ranking" className="lg:col-span-8" aria-labelledby="ranking">
          <TituloSecao nota={`Média de 0 a 10 · seta = variação sobre o ${c.bimestre - 1}º bimestre`}><span id="ranking">Turmas e matérias</span></TituloSecao>
          <div className="folha overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-pauta">
                  <th className="px-4 py-3 text-left font-normal"><span className="rotulo">Turma</span></th>
                  {c.materias.map((m) => <th key={m} className="px-3 py-3 text-right font-normal"><span className="rotulo">{m}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {c.tabela.map((t) => (
                  <tr key={t.turma.id} className="border-b border-pauta/70 last:border-0">
                    <th scope="row" className="px-4 py-3 text-left font-semibold">{t.turma.nome}</th>
                    {t.materias.map((m) => {
                      const cel = celulas.find((x) => x.turma === t.turma.nome && x.materia === m.materia)!;
                      return (
                        <td key={m.materia} className={clsx("px-3 py-3 text-right", topo.has(cel) && "bg-escola-claro/60", fundo.has(cel) && "bg-areia/60")}>
                          {m.atual === null ? <span className="text-grafite">—</span> : <span className="num font-serif text-[1.15rem]">{decimal(m.atual)}</span>}
                          {cel.delta !== null && (
                            <span className={clsx("num ml-1.5 font-mono text-[0.7rem]", cel.delta <= -0.3 ? "font-bold text-tinta" : "text-grafite")}>
                              {cel.delta >= 0 ? "↑" : "↓"}{decimal(Math.abs(cel.delta))}
                            </span>
                          )}
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
            {caiu && (
              <li className="folha border-l-2 border-l-alerta p-4">
                <p className="font-semibold">{queda.turma} em queda em {queda.materia}</p>
                <p className="text-sm text-grafite">Média {decimal(queda.anterior!)} → {decimal(queda.atual!)}</p>
              </li>
            )}
            {parados.map((p) => (
              <li key={p.id} className="folha p-4">
                <p className="font-semibold">{p.nome} sem lançar atividade</p>
                <p className="text-sm text-grafite">{p.ultimaAtividade ? `Última em ${dataCurta(p.ultimaAtividade.slice(0, 10))}` : "Nenhuma atividade"} · {p.turmas.join(", ")}</p>
              </li>
            ))}
            {c.alertasPorTurma.filter((t) => t.alunos > 0).map((t) => (
              <li key={t.turma} className="folha p-4">
                <p className="font-semibold">{t.alunos} aluno{t.alunos > 1 ? "s" : ""} do {t.turma} com alerta</p>
                <p className="text-sm text-grafite">{t.habilidades.join(", ")}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {profsMat.length > 1 && (
        <section id="comparar" className="mt-16 scroll-mt-28" aria-labelledby="comp">
          <TituloSecao nota="Domínio médio dos alunos em Matemática, 0 a 100"><span id="comp">Mesmo conteúdo, professores diferentes</span></TituloSecao>
          <div className="folha p-6">
            <div className="mb-5 flex flex-wrap gap-6 text-sm">
              {profsMat.map((p, i) => (
                <span key={p.professor} className="inline-flex items-center gap-2"><span className={clsx("size-3 rounded-full", MARCAS[i % MARCAS.length])} /> {p.professor} · {p.turmas.join(", ")}</span>
              ))}
            </div>
            <ul className="space-y-4">
              {c.comparacao.map(({ habilidade, porProfessor }) => {
                const vals = porProfessor.map((p) => p.media ?? 0);
                return (
                  <li key={habilidade.codigo} className="grid grid-cols-[9rem_1fr_5rem] items-center gap-4 text-sm sm:grid-cols-[12rem_1fr_6rem]">
                    <span><span className="font-semibold">{habilidade.nome}</span> <span className="font-mono text-[0.7rem] text-grafite">{habilidade.codigo}</span></span>
                    <span className="relative h-6" role="img" aria-label={`${habilidade.nome}: ${porProfessor.map((p) => `${p.professor} ${p.media}`).join(", ")}`}>
                      <span className="absolute inset-x-0 top-1/2 h-px bg-pauta-forte" />
                      {[25, 50, 75].map((t) => <span key={t} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-pauta-forte" style={{ left: `${t}%` }} />)}
                      <span className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-tinta/40" style={{ left: `${Math.min(...vals)}%`, width: `${Math.max(...vals) - Math.min(...vals)}%` }} />
                      {porProfessor.map((p, i) => <span key={p.professor} className={clsx("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full", MARCAS[i % MARCAS.length])} style={{ left: `${p.media ?? 0}%` }} />)}
                    </span>
                    <span className="num text-right font-mono text-xs text-grafite">{porProfessor.map((p) => p.media ?? "–").join(" · ")}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 grid grid-cols-[9rem_1fr_5rem] gap-4 sm:grid-cols-[12rem_1fr_6rem]" aria-hidden>
              <span />
              <span className="relative h-4 font-mono text-[0.68rem] text-grafite">
                {[0, 25, 50, 75, 100].map((t) => <span key={t} className="absolute -translate-x-1/2" style={{ left: `${t}%` }}>{t}</span>)}
              </span>
            </div>
          </div>
        </section>
      )}

      <section className="mt-16" aria-labelledby="profs">
        <TituloSecao nota="Última prova ou tarefa lançada"><span id="profs">Professores</span></TituloSecao>
        <ul className="grid gap-3 sm:grid-cols-2">
          {c.professores.map((p) => (
            <li key={p.id} className="folha flex items-baseline justify-between gap-4 p-4">
              <span><span className="font-semibold">{p.nome}</span><span className="block text-sm text-grafite">{p.materias.join(", ")} · {p.turmas.join(", ")}</span></span>
              <span className={clsx("num shrink-0 font-mono text-xs", (p.diasSemAtividade ?? 99) > 14 ? "font-bold text-tinta" : "text-grafite")}>
                {p.diasSemAtividade === null ? "sem atividade" : p.diasSemAtividade === 0 ? "hoje" : `há ${p.diasSemAtividade} d`}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Pagina>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import type { AlertReason } from "@escola/domain";
import { CodigoBncc, Decisao, Pagina, PorQue, Regua, TituloSecao } from "@/components/caderno";
import { Confirmar } from "@/components/confirmar";
import { Encaminhar, type OpcaoTutor } from "@/components/encaminhar";
import { MapaDeCalor } from "@/components/mapa-de-calor";
import { api } from "@/lib/api";
import { dataCurta, decimal } from "@/lib/formato";
import { descartarAlerta } from "../acoes";

export const metadata: Metadata = { title: "Quem precisa de você hoje" };

interface Painel {
  turmas: { id: string; turma: string; materia: string; alertas: number }[];
  turma: { id: string; nome: string; materia: string } | null;
  resumo: { sentence: string; skill: string; count: number; studentIds: string[]; habilidade: string; nomes: string[] } | null;
  alertas: { id: string; aluno: { id: string; nome: string }; habilidade: { id: string; codigo: string; nome: string }; frase: string; score: number; motivos: AlertReason[]; dominio: number }[];
  encaminhados: number;
  sugestoes: Record<string, OpcaoTutor[]>;
  mapa: { habilidades: { id: string; codigo: string; nome: string }[]; alunos: { id: string; nome: string }[]; dominio: Record<string, Record<string, number>> };
  prova: { id: string; titulo: string; media: number; questoesComAtencao: number } | null;
  mensagensNaoLidas: number;
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const listaNomes = (n: string[]) => (n.length <= 1 ? n.join("") : `${n.slice(0, -1).join(", ")} e ${n.at(-1)}`);

export default async function Professor({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const { turma } = await searchParams;
  const p = await api<Painel>(`/professor/painel${turma ? `?turma=${encodeURIComponent(turma)}` : ""}`);
  const hoje = new Date().toISOString().slice(0, 10);

  if (!p.turma) {
    return (
      <Pagina>
        <Decisao sobre={dataCurta(hoje)} frase="Você ainda não tem turmas." detalhe="Peça para a coordenação atribuir suas turmas e matérias." />
      </Pagina>
    );
  }
  const r = p.resumo;
  const melhor = r ? p.sugestoes[r.skill]?.[0] : undefined;
  const alertasDoResumo = r ? p.alertas.filter((a) => r.studentIds.includes(a.aluno.id) && a.habilidade.id === r.skill) : [];

  return (
    <Pagina>
      {p.turmas.length > 1 && (
        <nav aria-label="Turmas" className="mb-10 flex flex-wrap gap-2">
          {p.turmas.map((t) => (
            <Link key={t.id} href={`/professor?turma=${t.id}`} aria-current={t.id === p.turma!.id ? "page" : undefined} className="botao-linha min-h-9 text-sm aria-[current=page]:border-tinta aria-[current=page]:bg-folha aria-[current=page]:font-semibold">
              {t.turma} · {t.materia}
              {t.alertas > 0 && <span className="num font-mono text-xs text-grafite">{t.alertas}</span>}
            </Link>
          ))}
        </nav>
      )}

      <Decisao
        sobre={`${p.turma.nome} · ${p.turma.materia} · ${dataCurta(hoje)}`}
        frase={r ? <>{r.sentence}.</> : "Ninguém precisa de reforço hoje."}
        detalhe={
          r ? (
            <>
              {listaNomes(r.nomes)} acertaram menos nas últimas atividades de {r.habilidade}.
              {melhor?.horario && ` ${melhor.nome} tem horário livre ${melhor.horario}.`}
            </>
          ) : (
            "O detector olha as atividades de cada habilidade todos os dias. Quando alguém cair, aparece aqui."
          )
        }
      >
        {r && <Encaminhar alertas={alertasDoResumo.map((a) => ({ id: a.id, nome: a.aluno.nome.split(" ")[0]! }))} habilidade={r.habilidade} opcoes={p.sugestoes[r.skill] ?? []} rotulo={`Encaminhar ${r.count > 1 ? `os ${r.count}` : ""}`.trim()} />}
        {p.prova && <Link href={`/professor/provas/${p.prova.id}`} data-demo="ver-prova" className="botao-linha">Ver a prova corrigida</Link>}
      </Decisao>

      <div className="mt-16 grid gap-12 lg:grid-cols-12">
        <section className="lg:col-span-8" aria-labelledby="quem">
          <TituloSecao nota={`${p.alertas.length} alertas abertos${p.encaminhados ? ` · ${p.encaminhados} já no reforço` : ""}`}>
            <span id="quem">Quem precisa de você hoje</span>
          </TituloSecao>
          {p.alertas.length === 0 && <p className="text-grafite">Nenhum alerta aberto nesta turma.</p>}
          <ol className="entra-lista divide-y divide-pauta">
            {p.alertas.map((a) => (
              <li key={a.id} data-demo={`alerta-${semAcento(a.aluno.nome.split(" ")[0]!)}`} className="grid gap-x-6 gap-y-2 py-5 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-serif text-[1.35rem] leading-snug">{a.frase}</p>
                  <p className="mt-1 text-sm text-grafite">
                    {a.aluno.nome} · <CodigoBncc codigo={a.habilidade.codigo} />
                  </p>
                  <PorQue motivos={a.motivos} score={a.score} />
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <Regua valor={a.dominio} rotulo={`Domínio em ${a.habilidade.nome}`} />
                  <Encaminhar alertas={[{ id: a.id, nome: a.aluno.nome.split(" ")[0]! }]} habilidade={a.habilidade.nome} opcoes={p.sugestoes[a.habilidade.id] ?? []} variante="linha" />
                  <Confirmar rotulo="Não é o caso" carimbo="Descartado" variante="texto" acao={descartarAlerta.bind(null, a.id)} confirmar={`Descartar o alerta de ${a.aluno.nome.split(" ")[0]}? Ele não volta por 30 dias.`} />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="space-y-6 lg:col-span-4">
          {p.prova && (
            <div className="adesivo p-5">
              <p className="rotulo text-tinta/70">Prova corrigida</p>
              <p className="mt-2 font-serif text-[1.3rem] leading-snug">
                Média <span className="num">{decimal(p.prova.media)}</span>.{" "}
                {p.prova.questoesComAtencao > 0 ? `${p.prova.questoesComAtencao} questões merecem uma segunda olhada.` : "Nenhuma questão com problema."}
              </p>
              <Link href={`/professor/provas/${p.prova.id}`} className="link-sublinhado mt-3 inline-block text-sm font-semibold">Abrir relatório por questão</Link>
            </div>
          )}
          <div className="folha p-5">
            <p className="rotulo">Provas</p>
            <p className="mt-2">Crie a prova com o gabarito e lance as respostas: a correção e os alertas saem na hora.</p>
            <Link href="/professor/provas" className="link-sublinhado mt-3 inline-block text-sm font-semibold">Minhas provas</Link>
          </div>
          {p.mensagensNaoLidas > 0 && (
            <div className="folha border-l-2 border-l-escola p-5">
              <p className="font-semibold">{p.mensagensNaoLidas} mensagem{p.mensagensNaoLidas > 1 ? "s" : ""} de família</p>
              <Link href="/mensagens" className="link-sublinhado mt-1 inline-block text-sm">Ler e responder</Link>
            </div>
          )}
          <div className="folha p-5 text-sm text-grafite">
            <p className="rotulo">Como o alerta funciona</p>
            <p className="mt-2">
              Todo dia comparamos as 3 últimas atividades de cada habilidade com as anteriores, junto com frequência e tarefas.
              O alerta chega enquanto o domínio ainda está em progresso, antes de virar nota baixa. Ninguém muda nota ou turma automaticamente: a decisão é sua.
            </p>
          </div>
        </aside>
      </div>

      <section className="mt-16" aria-labelledby="mapa">
        <TituloSecao nota="Domínio de 0 a 100, recalculado a cada atividade"><span id="mapa">Mapa da turma</span></TituloSecao>
        <MapaDeCalor alunos={p.mapa.alunos} habilidades={p.mapa.habilidades} dominio={p.mapa.dominio} destaque={new Set(p.alertas.map((a) => a.aluno.id))} />
      </section>
    </Pagina>
  );
}

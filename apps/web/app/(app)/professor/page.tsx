import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, FileCheck2, Grid3x3, MessageSquare, Users } from "lucide-react";
import type { AlertReason } from "@escola/domain";
import { Card, CodigoBncc, Decisao, Dominio, Indicador, Nivel, Pagina, PorQue, Vazio } from "@/components/ui";
import { Confirmar } from "@/components/confirmar";
import { Encaminhar, type OpcaoTutor } from "@/components/encaminhar";
import { MapaDeCalor } from "@/components/mapa-de-calor";
import { api } from "@/lib/api";
import { dataCurta, decimal } from "@/lib/formato";

export const metadata: Metadata = { title: "Minhas turmas" };

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

const listaNomes = (n: string[]) => (n.length <= 1 ? n.join("") : `${n.slice(0, -1).join(", ")} e ${n.at(-1)}`);
const nivel = (s: number) => (s >= 65 ? "alto" : s >= 55 ? "medio" : "baixo");

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
        <nav aria-label="Turmas" className="flex flex-wrap gap-2">
          {p.turmas.map((t) => (
            <Link
              key={t.id}
              href={`/professor?turma=${t.id}`}
              aria-current={t.id === p.turma!.id ? "page" : undefined}
              className="btn btn-secundario aria-[current=page]:border-marinho aria-[current=page]:bg-marinho aria-[current=page]:text-white"
            >
              {t.turma} · {t.materia}
              {t.alertas > 0 && <span className="badge badge-perigo">{t.alertas}</span>}
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
            "O MUSAR acompanha as atividades de cada habilidade todos os dias. Quando alguém cair, aparece aqui."
          )
        }
      >
        {r && <Encaminhar alertas={alertasDoResumo.map((a) => ({ id: a.id, nome: a.aluno.nome.split(" ")[0]! }))} habilidade={r.habilidade} opcoes={p.sugestoes[r.skill] ?? []} rotulo={r.count > 1 ? `Indicar reforço para os ${r.count}` : "Indicar reforço"} />}
        {p.prova && <Link href={`/professor/provas/${p.prova.id}`} data-demo="ver-prova" className="btn btn-secundario">Ver a prova corrigida</Link>}
      </Decisao>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador icone={Users} rotulo="Alunos na turma" valor={p.mapa.alunos.length} detalhe={`${p.mapa.habilidades.length} habilidades acompanhadas`} />
        <Indicador icone={AlertTriangle} rotulo="Com alerta" valor={p.alertas.length} tom="perigo" detalhe={p.encaminhados ? `${p.encaminhados} já no reforço` : "Nenhum no reforço ainda"} />
        <Indicador icone={FileCheck2} rotulo="Média da última prova" valor={p.prova ? decimal(p.prova.media) : "—"} tom="ouro" detalhe={p.prova ? `${p.prova.questoesComAtencao} questões para revisar` : "Nenhuma prova lançada"} />
        <Indicador icone={MessageSquare} rotulo="Mensagens novas" valor={p.mensagensNaoLidas} tom="sucesso" detalhe={<Link href="/mensagens" className="link">Abrir mensagens</Link>} />
      </div>

      <Card titulo="Alunos com alerta" icone={AlertTriangle} acao={<Link href="/professor/provas" className="link">Provas da turma</Link>} semPadding>
        {p.alertas.length === 0 ? (
          <div className="p-5"><Vazio>Nenhum alerta aberto nesta turma.</Vazio></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabela min-w-[56rem]">
              <thead><tr><th>Aluno</th><th>Habilidade</th><th>Risco</th><th>Domínio</th><th>Motivo</th><th className="text-right">Ação</th></tr></thead>
              <tbody>
                {p.alertas.map((a) => (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap font-semibold">{a.aluno.nome}</td>
                    <td>{a.habilidade.nome} <CodigoBncc codigo={a.habilidade.codigo} /></td>
                    <td><Nivel nivel={nivel(a.score)} score={a.score} /></td>
                    <td><Dominio valor={a.dominio} /></td>
                    <td className="max-w-[18rem]"><PorQue motivos={a.motivos} score={a.score} /></td>
                    <td>
                      <span className="flex items-center justify-end gap-3">
                        <Confirmar rotulo="Descartar" carimbo="Descartado" variante="texto" acao={{ nome: "descartarAlerta", args: [a.id] }} confirmar={`Descartar o alerta de ${a.aluno.nome.split(" ")[0]}? Ele não volta por 30 dias.`} />
                        <Encaminhar alertas={[{ id: a.id, nome: a.aluno.nome.split(" ")[0]! }]} habilidade={a.habilidade.nome} opcoes={p.sugestoes[a.habilidade.id] ?? []} variante="pequeno" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card titulo="Mapa da turma" icone={Grid3x3} acao={<span className="text-xs text-suave">Domínio de 0 a 100 por habilidade</span>} semPadding>
        <MapaDeCalor alunos={p.mapa.alunos} habilidades={p.mapa.habilidades} dominio={p.mapa.dominio} destaque={new Set(p.alertas.map((a) => a.aluno.id))} />
      </Card>
    </Pagina>
  );
}

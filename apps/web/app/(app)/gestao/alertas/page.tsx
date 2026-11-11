import type { Metadata } from "next";
import type { AlertReason } from "@escola/domain";
import { Encaminhar, type OpcaoTutor } from "@/components/encaminhar";
import { Card, Dominio, Nivel, Pagina, PorQue, Titulo, Vazio } from "@/components/ui";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Alertas de risco" };

interface Dados {
  tutores: { id: string; nome: string; especialidades: string[]; horarios: string[]; modo: string; carga: number; taxa: number | null }[];
  alertas: {
    id: string;
    aluno: string;
    turma: string;
    habilidade: { nome: string; codigo: string; materia: string };
    frase: string;
    score: number;
    nivel: string;
    dominio: number;
    motivos: AlertReason[];
    status: "ABERTO" | "ENCAMINHADO";
    pedido?: { status: string; tutor?: string };
    sugeridos: { id: string; score: number; motivos: string[] }[];
  }[];
}

const SITUACAO: Record<string, [string, string]> = {
  AGUARDANDO_RESPONSAVEL: ["badge-atencao", "Aguardando família"],
  APROVADO: ["badge-info", "Aprovado pela família"],
  EM_ANDAMENTO: ["badge-sucesso", "Em reforço"],
  RECUSADO: ["badge-neutro", "Família recusou"],
  CONCLUIDO: ["badge-sucesso", "Concluído"],
};

export default async function Alertas() {
  const d = await api<Dados>("/gestao/alertas");
  const abertos = d.alertas.filter((a) => a.status === "ABERTO");
  const encaminhados = d.alertas.filter((a) => a.status === "ENCAMINHADO");
  const MODO: Record<string, string> = { ambos: "presencial ou online", presencial: "presencial", online: "online" };
  const tutores = d.tutores.map((t) => ({ ...t, modo: MODO[t.modo] ?? t.modo }));
  const tutor = new Map(tutores.map((t) => [t.id, t]));

  const opcoes = (a: Dados["alertas"][number]) => {
    const sug: OpcaoTutor[] = a.sugeridos.map((s) => ({ ...tutor.get(s.id)!, id: s.id, score: s.score, motivos: s.motivos }));
    const ids = new Set(sug.map((s) => s.id));
    const outros: OpcaoTutor[] = tutores.filter((t) => !ids.has(t.id));
    return { sug, outros };
  };

  return (
    <Pagina>
      <Titulo
        titulo="Alertas de risco"
        subtitulo={`${abertos.length} aguardando decisão · ${encaminhados.length} já com professor de reforço`}
      />

      <Card titulo="Aguardando decisão" semPadding data-demo="lista-alertas">
        {abertos.length === 0 ? (
          <div className="p-5"><Vazio>Nenhum alerta aguardando decisão.</Vazio></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabela min-w-[56rem]">
              <thead><tr><th>Aluno</th><th>Habilidade</th><th>Risco</th><th>Domínio</th><th>Motivo</th><th className="text-right">Ação</th></tr></thead>
              <tbody>
                {abertos.map((a) => {
                  const { sug, outros } = opcoes(a);
                  return (
                    <tr key={a.id} id={a.id} className="scroll-mt-24" data-demo={a.aluno.startsWith("João") ? "alerta-joao" : undefined}>
                      <td><span className="font-semibold">{a.aluno}</span><span className="block text-xs text-suave">{a.turma}</span></td>
                      <td>{a.habilidade.nome}<span className="block text-xs text-suave">{a.habilidade.materia} · {a.habilidade.codigo}</span></td>
                      <td><Nivel nivel={a.nivel} score={a.score} /></td>
                      <td><Dominio valor={a.dominio} /></td>
                      <td className="max-w-[18rem]"><PorQue motivos={a.motivos} score={a.score} /></td>
                      <td className="text-right">
                        <Encaminhar alertas={[{ id: a.id, nome: a.aluno.split(" ")[0]! }]} habilidade={a.habilidade.nome} opcoes={sug} outros={outros} variante="pequeno" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card titulo="Com professor de reforço" semPadding>
        {encaminhados.length === 0 ? (
          <div className="p-5"><Vazio>Nenhum aluno encaminhado ainda.</Vazio></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabela min-w-[44rem]">
              <thead><tr><th>Aluno</th><th>Habilidade</th><th>Risco</th><th>Professor de reforço</th><th>Situação</th></tr></thead>
              <tbody>
                {encaminhados.map((a) => {
                  const s = SITUACAO[a.pedido?.status ?? ""] ?? ["badge-neutro", "—"];
                  return (
                    <tr key={a.id}>
                      <td><span className="font-semibold">{a.aluno}</span><span className="block text-xs text-suave">{a.turma}</span></td>
                      <td>{a.habilidade.nome}<span className="block text-xs text-suave">{a.habilidade.materia}</span></td>
                      <td><Nivel nivel={a.nivel} score={a.score} /></td>
                      <td className="font-semibold">{a.pedido?.tutor ?? "—"}</td>
                      <td><span className={`badge ${s[0]}`}>{s[1]}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Pagina>
  );
}

import type { Metadata } from "next";
import { LifeBuoy, Users } from "lucide-react";
import { Card, Pagina, Titulo } from "@/components/ui";
import { api } from "@/lib/api";
import { dataCurta, iniciais } from "@/lib/formato";

export const metadata: Metadata = { title: "Equipe" };

interface Equipe {
  professores: { id: string; nome: string; materias: string[]; turmas: string[]; ultimaAtividade: string | null; diasSemAtividade: number | null }[];
  reforco: { id: string; nome: string; especialidades: string[]; horarios: string[]; modo: string; alunosAtivos: number; atendidos: number; taxa: number | null }[];
}

const MODO: Record<string, string> = { ambos: "Presencial e online", presencial: "Presencial", online: "Online" };

export default async function Equipe() {
  const e = await api<Equipe>("/gestao/equipe");
  return (
    <Pagina>
      <Titulo titulo="Equipe" subtitulo={`${e.professores.length} professores · ${e.reforco.length} professores de reforço`} />

      <Card titulo="Professores de reforço" icone={LifeBuoy} semPadding>
        <div className="overflow-x-auto">
          <table className="tabela min-w-[52rem]">
            <thead><tr><th>Nome</th><th>Especialidades</th><th>Horários livres</th><th>Atendimento</th><th className="text-right">Alunos agora</th><th className="text-right">Recuperação</th></tr></thead>
            <tbody>
              {e.reforco.map((r) => (
                <tr key={r.id}>
                  <td><span className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-full bg-ouro-claro text-xs font-bold text-[#8a6417]">{iniciais(r.nome)}</span><span className="font-semibold">{r.nome}</span></span></td>
                  <td><span className="flex flex-wrap gap-1">{r.especialidades.map((s) => <span key={s} className="badge badge-info">{s}</span>)}</span></td>
                  <td className="text-suave">{r.horarios.join(", ") || "—"}</td>
                  <td className="text-suave">{MODO[r.modo] ?? r.modo}</td>
                  <td className="num text-right font-semibold">{r.alunosAtivos}</td>
                  <td className="num text-right">{r.taxa === null ? <span className="text-suave">—</span> : <span className={r.taxa >= 80 ? "font-semibold text-sucesso" : ""}>{r.taxa}% <span className="text-xs text-suave">de {r.atendidos}</span></span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card titulo="Professores" icone={Users} semPadding>
        <div className="overflow-x-auto">
          <table className="tabela min-w-[44rem]">
            <thead><tr><th>Nome</th><th>Matérias</th><th>Turmas</th><th>Última atividade lançada</th></tr></thead>
            <tbody>
              {e.professores.map((p) => (
                <tr key={p.id}>
                  <td><span className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-full bg-azul-fundo text-xs font-bold text-azul">{iniciais(p.nome)}</span><span className="font-semibold">{p.nome}</span></span></td>
                  <td>{p.materias.join(", ")}</td>
                  <td className="text-suave">{p.turmas.join(", ")}</td>
                  <td>
                    {p.ultimaAtividade ? dataCurta(p.ultimaAtividade) : "—"}{" "}
                    {(p.diasSemAtividade ?? 0) > 14 && <span className="badge badge-atencao ml-1">há {p.diasSemAtividade} dias</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Pagina>
  );
}

import type { Metadata } from "next";
import clsx from "clsx";
import { BarChart3, Users } from "lucide-react";
import { Card, Pagina, Titulo } from "@/components/ui";
import { Confirmar } from "@/components/confirmar";
import { api } from "@/lib/api";
import { decimal } from "@/lib/formato";
import { rodarDetector } from "../../acoes";

export const metadata: Metadata = { title: "Relatórios" };

interface Coord {
  bimestre: number;
  materias: string[];
  tabela: { turma: { id: string; nome: string }; materias: { materia: string; atual: number | null; anterior: number | null }[] }[];
  comparacao: { habilidade: { codigo: string; nome: string }; porProfessor: { professor: string; turmas: string[]; media: number | null }[] }[];
}

const CORES = ["#2d6b8d", "#daa241", "#539fbb", "#143150"];

export default async function Relatorios() {
  const c = await api<Coord>("/coordenacao");
  const profs = c.comparacao[0]?.porProfessor ?? [];
  return (
    <Pagina>
      <Titulo titulo="Relatórios" subtitulo={`${c.bimestre}º bimestre comparado ao ${c.bimestre - 1}º`}>
        <Confirmar rotulo="Atualizar alertas agora" carimbo="Atualizado" variante="linha" acao={rodarDetector} />
      </Titulo>

      <Card titulo="Média por turma e matéria" icone={BarChart3} semPadding>
        <div className="overflow-x-auto">
          <table className="tabela min-w-[42rem]">
            <thead><tr><th>Turma</th>{c.materias.map((m) => <th key={m} className="text-right">{m}</th>)}</tr></thead>
            <tbody>
              {c.tabela.map((t) => (
                <tr key={t.turma.id}>
                  <td className="font-semibold">{t.turma.nome}</td>
                  {t.materias.map((m) => {
                    const d = m.atual !== null && m.anterior !== null ? m.atual - m.anterior : null;
                    return (
                      <td key={m.materia} className="text-right">
                        <span className={clsx("num font-semibold", m.atual !== null && m.atual < 6 ? "text-perigo" : "text-marinho")}>{decimal(m.atual)}</span>
                        {d !== null && <span className={clsx("num ml-1.5 text-[0.72rem]", d <= -0.3 ? "font-semibold text-perigo" : d >= 0.3 ? "text-sucesso" : "text-suave")}>{d >= 0 ? "▲" : "▼"}{decimal(Math.abs(d))}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {profs.length > 1 && (
        <Card titulo="Mesmo conteúdo, professores diferentes" icone={Users}>
          <p className="-mt-1 mb-4 text-xs text-suave">Domínio médio dos alunos em cada habilidade de Matemática, de 0 a 100</p>
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            {profs.map((p, i) => <span key={p.professor} className="inline-flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: CORES[i % CORES.length] }} />{p.professor} · {p.turmas.join(", ")}</span>)}
          </div>
          <ul className="space-y-3">
            {c.comparacao.map(({ habilidade, porProfessor }) => (
              <li key={habilidade.codigo} className="grid grid-cols-[10rem_1fr] items-center gap-4 text-sm sm:grid-cols-[13rem_1fr]">
                <span className="truncate"><span className="font-semibold">{habilidade.nome}</span> <span className="text-xs text-suave">{habilidade.codigo}</span></span>
                <span className="space-y-1">
                  {porProfessor.map((p, i) => (
                    <span key={p.professor} className="flex items-center gap-2">
                      <span className="h-2.5 rounded-full" style={{ width: `${p.media ?? 0}%`, background: CORES[i % CORES.length] }} />
                      <span className="num text-xs text-suave">{p.media ?? "—"}</span>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Pagina>
  );
}

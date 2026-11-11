import Link from "next/link";
import type { Metadata } from "next";
import { Card, Pagina, Titulo, Vazio } from "@/components/ui";
import { api } from "@/lib/api";
import { dataCurta } from "@/lib/formato";

export const metadata: Metadata = { title: "Reforços" };

interface Pedido { id: string; aluno: string; turma: string; habilidade?: string; tutor?: string; indicadoPor?: string; status: string; sessoes: number; realizadas: number; planejadas: number | null; criadoEm: string }

const ETAPAS: { status: string; rotulo: string; cor: string }[] = [
  { status: "AGUARDANDO_RESPONSAVEL", rotulo: "Aguardando família", cor: "badge-atencao" },
  { status: "APROVADO", rotulo: "Aprovado", cor: "badge-info" },
  { status: "EM_ANDAMENTO", rotulo: "Em andamento", cor: "badge-sucesso" },
  { status: "CONCLUIDO", rotulo: "Concluído", cor: "badge-neutro" },
  { status: "RECUSADO", rotulo: "Recusado", cor: "badge-neutro" },
];

export default async function Reforcos() {
  const ps = await api<Pedido[]>("/gestao/reforcos");
  const etapa = (s: string) => ETAPAS.find((e) => e.status === s) ?? ETAPAS[0]!;
  return (
    <Pagina>
      <Titulo titulo="Reforços" subtitulo="Do pedido à conclusão, de toda a escola">
        <Link href="/gestao/alertas" className="btn btn-primario">Indicar reforço</Link>
      </Titulo>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ETAPAS.map((e) => (
          <div key={e.status} className="card p-4">
            <span className={`badge ${e.cor}`}>{e.rotulo}</span>
            <p className="num mt-2 font-titulo text-2xl font-semibold">{ps.filter((p) => p.status === e.status).length}</p>
          </div>
        ))}
      </div>

      <Card semPadding>
        {ps.length === 0 ? (
          <div className="p-5"><Vazio>Nenhum reforço ainda. Indique um professor a partir dos alertas.</Vazio></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabela min-w-[52rem]">
              <thead><tr><th>Aluno</th><th>Habilidade</th><th>Professor de reforço</th><th>Indicado por</th><th>Sessões</th><th>Situação</th></tr></thead>
              <tbody>
                {ps.map((p) => (
                  <tr key={p.id}>
                    <td><span className="font-semibold">{p.aluno}</span><span className="block text-xs text-suave">{p.turma} · {dataCurta(p.criadoEm)}</span></td>
                    <td>{p.habilidade}</td>
                    <td className="font-semibold">{p.tutor}</td>
                    <td className="text-suave">{p.indicadoPor}</td>
                    <td className="num">{p.realizadas}{p.planejadas ? ` de ${p.planejadas}` : ""}</td>
                    <td><span className={`badge ${etapa(p.status).cor}`}>{etapa(p.status).rotulo}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Pagina>
  );
}

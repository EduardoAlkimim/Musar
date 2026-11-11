import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, Bell, CheckCircle2, GraduationCap, HeartHandshake, LifeBuoy, MessageSquare, TrendingUp, Users } from "lucide-react";
import { Aviso, Barra, Card, CORES_TURMAS, GraficoLinhas, Indicador, Nivel, Pagina, Titulo, Vazio } from "@/components/ui";
import { api } from "@/lib/api";
import { decimal, haQuanto } from "@/lib/formato";

export const metadata: Metadata = { title: "Visão geral" };

interface Visao {
  escola: string;
  bimestre: number;
  indicadores: { alunos: number; emRisco: number; intervencoes: number; taxaRecuperacao: number | null; mediaGeral: number | null; mediaAnterior: number | null; turmas: number };
  evolucao: { meses: string[]; escola: (number | null)[]; turmas: { id: string; nome: string; valores: (number | null)[] }[] };
  riscoPorMateria: { materia: string; percentual: number }[];
  alunosComAlerta: { id: string; aluno: string; turma: string; habilidade: string; materia: string; score: number; nivel: string; situacao: string }[];
  notificacoes: { tipo: string; texto: string; em: string }[];
}

const ICONE_NOTIF = { alerta: AlertTriangle, reforco: LifeBuoy, aprovado: CheckCircle2, mensagem: MessageSquare } as const;
const COR_NOTIF = { alerta: "bg-atencao-claro text-atencao", reforco: "bg-azul-fundo text-azul", aprovado: "bg-sucesso-claro text-sucesso", mensagem: "bg-ouro-claro text-[#a8781f]" } as const;

export default async function VisaoGeral() {
  const v = await api<Visao>("/gestao/visao-geral");
  const i = v.indicadores;
  const delta = i.mediaGeral !== null && i.mediaAnterior !== null ? i.mediaGeral - i.mediaAnterior : null;
  const altos = v.alunosComAlerta.filter((a) => a.nivel === "alto").length;

  return (
    <Pagina>
      <Titulo titulo={v.escola} subtitulo={`Painel geral · ${v.bimestre}º bimestre`} />

      {i.emRisco > 0 && (
        <Aviso>
          <strong>{i.emRisco} alunos</strong> com alerta de risco de desempenho{altos ? `, ${altos} com nível alto` : ""} ·{" "}
          <Link href="/gestao/alertas" className="font-semibold text-perigo hover:underline">Ver agora →</Link>
        </Aviso>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador icone={Users} rotulo="Total de alunos" valor={i.alunos} detalhe={`${i.turmas} turmas`} />
        <Indicador icone={AlertTriangle} rotulo="Em risco" valor={i.emRisco} tom="perigo" detalhe={`${Math.round((i.emRisco / Math.max(1, i.alunos)) * 100)}% dos alunos`} />
        <Indicador icone={HeartHandshake} rotulo="Reforços ativos" valor={i.intervencoes} tom="sucesso" detalhe={i.taxaRecuperacao !== null ? `${i.taxaRecuperacao}% de recuperação` : "Sem histórico ainda"} tendencia={i.taxaRecuperacao !== null ? "sobe" : undefined} />
        <Indicador icone={GraduationCap} rotulo="Média geral" valor={decimal(i.mediaGeral)} tom="ouro" detalhe={delta !== null ? `${delta >= 0 ? "+" : ""}${decimal(delta)} vs bimestre anterior` : undefined} tendencia={delta === null ? undefined : delta >= 0 ? "sobe" : "desce"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card titulo="Desempenho por turma — evolução" icone={TrendingUp} acao={<Link href="/gestao/relatorios" className="link">Ver detalhes</Link>} className="xl:col-span-2">
          <GraficoLinhas
            rotulos={v.evolucao.meses}
            series={[
              ...v.evolucao.turmas.map((t, n) => ({ nome: t.nome, valores: t.valores, cor: CORES_TURMAS[n % CORES_TURMAS.length]! })),
              { nome: "Escola", valores: v.evolucao.escola, cor: "#daa241", destaque: true },
            ]}
          />
        </Card>
        <Card titulo="Risco por disciplina" icone={AlertTriangle}>
          <p className="-mt-1 mb-4 text-xs text-suave">Alunos com média abaixo de 6,0 no bimestre</p>
          <ul className="space-y-3.5">
            {v.riscoPorMateria.map((r) => (
              <li key={r.materia} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-sm">
                <span className="truncate">{r.materia}</span>
                <Barra valor={r.percentual} />
                <span className="num text-right font-semibold">{r.percentual}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card titulo="Alunos com alerta ativo" icone={AlertTriangle} acao={<Link href="/gestao/alertas" className="link">Ver todos →</Link>} className="xl:col-span-3" semPadding data-demo="alunos-alerta">
          {v.alunosComAlerta.length === 0 ? (
            <div className="p-5"><Vazio>Nenhum aluno com alerta. O detector roda todo dia.</Vazio></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabela min-w-[40rem]">
                <thead><tr><th>Aluno</th><th>Turma</th><th>Habilidade</th><th>Risco</th><th>Situação</th><th /></tr></thead>
                <tbody>
                  {v.alunosComAlerta.map((a) => (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap font-semibold">{a.aluno}</td>
                      <td className="whitespace-nowrap">{a.turma}</td>
                      <td>{a.habilidade} <span className="text-xs text-suave">· {a.materia}</span></td>
                      <td><Nivel nivel={a.nivel} score={a.score} /></td>
                      <td className="whitespace-nowrap text-suave">{a.situacao}</td>
                      <td className="text-right">
                        {a.situacao === "Aguardando decisão" && <Link href={`/gestao/alertas#${a.id}`} className="btn btn-secundario btn-pequeno">Indicar reforço</Link>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card titulo="Notificações recentes" icone={Bell} className="xl:col-span-2">
          {v.notificacoes.length === 0 ? (
            <Vazio>Nada novo nos últimos 14 dias.</Vazio>
          ) : (
            <ul className="-my-2 divide-y divide-[#eef2f5]">
              {v.notificacoes.map((n, k) => {
                const tipo = (n.tipo in ICONE_NOTIF ? n.tipo : "alerta") as keyof typeof ICONE_NOTIF;
                const Icone = ICONE_NOTIF[tipo];
                return (
                  <li key={k} className="flex gap-3 py-3">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-[9px] ${COR_NOTIF[tipo]}`}><Icone className="size-4" /></span>
                    <span className="min-w-0">
                      <span className="block text-sm">{n.texto}</span>
                      <span className="block text-xs text-suave">{haQuanto(n.em)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </Pagina>
  );
}

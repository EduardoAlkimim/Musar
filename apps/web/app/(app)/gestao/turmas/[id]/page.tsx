import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Card, Pagina, Titulo } from "@/components/ui";
import { api } from "@/lib/api";
import { decimal } from "@/lib/formato";

export const metadata: Metadata = { title: "Turma" };

interface Detalhe {
  turma: { id: string; nome: string; serie: string; turno: string };
  materias: string[];
  alunos: { id: string; nome: string; frequencia: number; alertas: number; notas: Record<string, number | null> }[];
}

const corNota = (n: number | null | undefined) => (n === null || n === undefined ? "text-suave" : n < 6 ? "font-semibold text-perigo" : n < 7 ? "text-atencao" : "text-marinho");

export default async function Turma({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await api<Detalhe>(`/gestao/turmas/${id}`);
  return (
    <Pagina>
      <Link href="/gestao/turmas" className="link inline-flex items-center gap-1 text-sm"><ArrowLeft className="size-4" /> Turmas</Link>
      <Titulo titulo={d.turma.nome} subtitulo={`${d.alunos.length} alunos · notas do bimestre atual, de 0 a 10`} />
      <Card semPadding>
        <div className="overflow-x-auto">
          <table className="tabela min-w-[48rem]">
            <thead>
              <tr>
                <th>Aluno</th>
                {d.materias.map((m) => <th key={m} className="text-right">{m}</th>)}
                <th className="text-right">Frequência</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {d.alunos.map((a) => (
                <tr key={a.id}>
                  <td className="font-semibold">{a.nome}</td>
                  {d.materias.map((m) => <td key={m} className={`num text-right ${corNota(a.notas[m])}`}>{decimal(a.notas[m])}</td>)}
                  <td className={`num text-right ${a.frequencia < 75 ? "font-semibold text-perigo" : ""}`}>{a.frequencia}%</td>
                  <td>{a.alertas ? <span className="badge badge-perigo">{a.alertas} alerta{a.alertas > 1 ? "s" : ""}</span> : <span className="badge badge-sucesso">Em dia</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Pagina>
  );
}

import type { Metadata } from "next";
import { Decisao, Pagina } from "@/components/caderno";
import { LancarRespostas } from "@/components/lancar-respostas";
import { api } from "@/lib/api";
import { dataCurta } from "@/lib/formato";

export const metadata: Metadata = { title: "Lançar respostas" };

interface Lancamento {
  prova: { id: string; titulo: string; data: string; turma: string; materia: string };
  questoes: { numero: number; alternativas: number; gabarito: number }[];
  alunos: { id: string; nome: string; respostas: (number | null | undefined)[] }[];
}

export default async function Respostas({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await api<Lancamento>(`/provas/${id}/lancamento`);
  return (
    <Pagina>
      <Decisao
        sobre={`${l.prova.titulo} · ${l.prova.turma} · ${dataCurta(l.prova.data.slice(0, 10))}`}
        frase="Digite as letras que cada aluno marcou."
        detalhe="Ao salvar, a prova é corrigida pelo gabarito e os alertas da turma são recalculados."
      />
      <div className="mt-12">
        <LancarRespostas provaId={l.prova.id} questoes={l.questoes} alunos={l.alunos} />
      </div>
    </Pagina>
  );
}

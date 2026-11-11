import Link from "next/link";
import type { Metadata } from "next";
import { Decisao, Pagina, TituloSecao } from "@/components/caderno";
import { api } from "@/lib/api";
import { dataCurta } from "@/lib/formato";

export const metadata: Metadata = { title: "Minhas provas" };

export interface Atribuicoes {
  atribuicoes: { id: string; turma: string; materia: string; habilidades: { id: string; codigo: string; nome: string; descricao: string }[] }[];
  provas: { id: string; titulo: string; data: string; tipo: string; turma?: string }[];
}

export default async function Provas() {
  const a = await api<Atribuicoes>("/professor/atribuicoes");
  return (
    <Pagina>
      <Decisao sobre="Provas e simulados" frase="Crie a prova com o gabarito. A correção é automática." detalhe="Depois de aplicar, lance as letras que cada aluno marcou. Notas, relatório por questão e alertas saem na hora.">
        <Link href="/professor/provas/nova" className="botao-tinta">Nova prova</Link>
      </Decisao>
      <section className="mt-14" aria-labelledby="lista">
        <TituloSecao nota={`${a.provas.length} provas`}><span id="lista">Provas recentes</span></TituloSecao>
        {a.provas.length === 0 && <p className="text-grafite">Nenhuma prova ainda.</p>}
        <ul className="divide-y divide-pauta">
          {a.provas.map((p) => (
            <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-4 py-4">
              <div>
                <Link href={`/professor/provas/${p.id}`} className="font-serif text-[1.25rem] hover:text-escola">{p.titulo}</Link>
                <p className="text-sm text-grafite">{p.turma} · {dataCurta(p.data.slice(0, 10))}</p>
              </div>
              <div className="flex gap-3 text-sm">
                <Link href={`/professor/provas/${p.id}`} className="link-sublinhado">Relatório</Link>
                <Link href={`/professor/provas/${p.id}/respostas`} className="link-sublinhado">Lançar respostas</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Pagina>
  );
}

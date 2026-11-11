import type { Metadata } from "next";
import { Decisao, Pagina, TituloSecao } from "@/components/ui";
import { Importar } from "@/components/importar";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Cadastros" };

export default async function Admin() {
  const r = await api<{ escola: { nome: string }; turmas: number; alunos: number; pessoas: number; colunas: string[] }>("/admin/resumo");
  return (
    <Pagina className="max-w-[52rem]">
      <Decisao sobre={`${r.escola.nome} · cadastros`} frase="Traga alunos e turmas de uma planilha." detalhe="Turma que não existe é criada. Aluno que já existe é atualizado. Se alguma linha tiver erro, nada é gravado e você vê qual linha corrigir." />

      <dl className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-[10px] border border-borda bg-borda">
        {[["Turmas", r.turmas], ["Alunos matriculados", r.alunos], ["Pessoas com vínculo", r.pessoas]].map(([k, v]) => (
          <div key={k} className="bg-white px-5 py-4">
            <dt className="rotulo">{k}</dt>
            <dd className="num mt-1 font-titulo text-[2rem] leading-none">{v}</dd>
          </div>
        ))}
      </dl>

      <section data-demo="importar" className="card p-5" aria-labelledby="imp">
        <TituloSecao nota={<a href="/modelo-alunos.csv" download className="link">Baixar planilha modelo</a>}><span id="imp">Importar planilha</span></TituloSecao>
        <Importar />
        <div className="rounded-[10px] bg-[#f7fafc] py-2 mt-8 px-5 text-sm">
          <p className="font-semibold">Colunas</p>
          <p className="font-mono">{r.colunas.join(" ; ")}</p>
          <p>Data no formato AAAA-MM-DD. Turno: manhã, tarde, noite ou integral.</p>
          <p>Responsável é opcional. Com e-mail, ele entra com esse e-mail e aceita o termo no primeiro acesso.</p>
        </div>
      </section>
    </Pagina>
  );
}

import type { Metadata } from "next";
import clsx from "clsx";
import { Decisao, Pagina } from "@/components/ui";
import { api } from "@/lib/api";
import { dataCurta, decimal, letra, pct } from "@/lib/formato";

export const metadata: Metadata = { title: "Seu próximo passo" };

interface Aluno {
  nome: string;
  turma?: string;
  prova: {
    titulo: string;
    materia: string;
    data: string;
    nota: number;
    erradas: { numero: number; enunciado: string; alternativas: string[]; gabarito: number; marcada: number | null; habilidade?: string; indica: string | null; acertoDaTurma?: number }[];
  } | null;
  reforcos: { status: string; habilidade?: string; tutor?: string; sessoes: { inicio: string; modo: string }[] }[];
  agenda: { titulo: string; materia: string; data: string; tipo: string }[];
}

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const STATUS: Record<string, string> = { AGUARDANDO_RESPONSAVEL: "esperando a aprovação do seu responsável", APROVADO: "aprovado; a primeira sessão vai ser marcada", EM_ANDAMENTO: "em andamento" };

export default async function PaginaAluno() {
  const a = await api<Aluno>("/aluno");
  const nome = a.nome.split(" ")[0];
  const proximo = a.prova?.erradas[0];

  return (
    <Pagina className="max-w-[34rem]">
      <Decisao
        sobre={`Oi, ${nome} · ${a.turma ?? ""} · ${dataCurta(new Date().toISOString().slice(0, 10))}`}
        frase={proximo ? "Seu próximo passo leva 10 minutos." : "Nada pendente por aqui."}
        detalhe={proximo && a.prova ? `Revisar a questão ${proximo.numero} de ${a.prova.materia}${proximo.habilidade ? `, sobre ${proximo.habilidade}` : ""}. ${pct(proximo.acertoDaTurma ?? 0)} da turma acertou: dá para recuperar.` : undefined}
      />

      {a.prova && (
        <section data-demo="revisao" className="card entra mt-8 overflow-hidden" aria-labelledby="prova">
          <div className="border-b border-borda px-5 py-4">
            <p className="rotulo">{a.prova.titulo}</p>
            <h2 id="prova" className="mt-1 text-[1.2rem] font-semibold">Sua nota: <span className="num">{decimal(a.prova.nota)}</span></h2>
            <p className="text-sm text-suave">{a.prova.erradas.length === 0 ? "Você acertou tudo." : `${a.prova.erradas.length} questões para revisar, da mais fácil de recuperar para a mais difícil.`}</p>
          </div>
          <ol className="divide-y divide-borda">
            {a.prova.erradas.map((q, i) => (
              <li key={q.numero} className={clsx("px-5 py-5", i === 0 && "bg-[#f7fafc]/60")}>
                <p className="rotulo">Questão {q.numero}{q.habilidade ? ` · ${q.habilidade}` : ""}</p>
                <p className="mt-1 font-semibold text-marinho">{q.enunciado}</p>
                <p className="mt-3 text-sm">
                  Você marcou <strong className="font-mono">{q.marcada === null ? "em branco" : `${letra(q.marcada)}) ${q.alternativas[q.marcada]}`}</strong>. A certa é{" "}
                  <strong className="font-mono text-azul">{letra(q.gabarito)}) {q.alternativas[q.gabarito]}</strong>.
                </p>
                {q.indica && (
                  <div className="rounded-[10px] bg-[#f7fafc] py-2 mt-3 px-4">
                    <p className="font-semibold">Por que errei?</p>
                    <p>Essa resposta costuma aparecer quando a pessoa {q.indica}.</p>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {a.reforcos.length > 0 && (
        <section className="mt-12" aria-labelledby="reforco">
          <h2 id="reforco" className="text-[1.1rem] font-semibold">Reforço</h2>
          <ul className="mt-3 space-y-3">
            {a.reforcos.map((r, i) => (
              <li key={i} className="card p-4">
                <p className="font-semibold">{r.habilidade} com {r.tutor}</p>
                <p className="text-sm text-suave">{STATUS[r.status] ?? r.status}</p>
                {r.sessoes[0] && <p className="mt-1 text-sm">Próxima sessão: {quando(r.sessoes[0].inicio)} · {r.sessoes[0].modo}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12" aria-labelledby="agenda">
        <h2 id="agenda" className="text-[1.1rem] font-semibold">O que vem por aí</h2>
        {a.agenda.length === 0 ? (
          <p className="mt-2 text-suave">Nenhuma prova ou tarefa marcada.</p>
        ) : (
          <ul className="mt-3 divide-y divide-borda border-y border-borda">
            {a.agenda.map((c) => (
              <li key={c.titulo + c.data} className="grid grid-cols-[6.5rem_1fr] gap-3 py-3">
                <span className="num font-mono text-sm text-suave">{dataCurta(c.data.slice(0, 10))}</span>
                <span>{c.titulo} <span className="text-suave">· {c.materia}</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Pagina>
  );
}

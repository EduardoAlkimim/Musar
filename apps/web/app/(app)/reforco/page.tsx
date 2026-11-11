import type { Metadata } from "next";
import type { AlertReason } from "@escola/domain";
import { CodigoBncc, Decisao, Pagina, PorQue, Regua, TituloSecao } from "@/components/caderno";
import { Agendar, Concluir, Registrar } from "@/components/reforco-acoes";
import { api } from "@/lib/api";
import { dataCurta } from "@/lib/formato";

export const metadata: Metadata = { title: "Agenda e fila de reforço" };

interface Fila {
  horarios: string[];
  itens: {
    id: string;
    status: "AGUARDANDO_RESPONSAVEL" | "APROVADO" | "EM_ANDAMENTO";
    aluno: { id: string; nome: string; turma?: string };
    habilidade: { codigo: string; nome: string; descricao: string };
    dominio: number;
    motivos: AlertReason[];
    score: number;
    plano: { sessoes?: number; minutos?: number; saida?: string };
    pedidoPor?: string;
    pedidoEm: string;
    sessoes: { id: string; inicio: string; modo: string; registro: string | null }[];
  }[];
}

const STATUS = { AGUARDANDO_RESPONSAVEL: "Aguardando o responsável", APROVADO: "Aprovado pela família", EM_ANDAMENTO: "Em andamento" } as const;
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const diaSP = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

/** Próximo horário livre do professor ("ter 14:00") como valor de datetime-local. */
function proximoHorario(horarios: string[]) {
  const agora = new Date();
  for (let d = 1; d <= 7; d++) {
    const dia = new Date(agora.getTime() + d * 86_400_000);
    const h = horarios.find((x) => x.startsWith(DIAS[dia.getDay()]!));
    if (h) return `${dia.toISOString().slice(0, 10)}T${h.split(" ")[1]}`;
  }
  return `${new Date(agora.getTime() + 86_400_000).toISOString().slice(0, 10)}T14:00`;
}

export default async function Reforco() {
  const f = await api<Fila>("/reforco/fila");
  const novos = f.itens.filter((i) => i.status !== "EM_ANDAMENTO");
  const pronto = novos.find((i) => i.status === "APROVADO");
  const hoje = new Date();
  const segunda = new Date(hoje.getTime() - ((hoje.getDay() + 6) % 7) * 86_400_000);
  const semana = Array.from({ length: 5 }, (_, i) => new Date(segunda.getTime() + i * 86_400_000).toISOString().slice(0, 10));
  const sessoes = f.itens.flatMap((i) => i.sessoes.map((s) => ({ ...s, aluno: i.aluno.nome, habilidade: i.habilidade.nome, total: i.plano.sessoes, ordem: i.sessoes.indexOf(s) + 1 })));

  return (
    <Pagina>
      <Decisao
        sobre={`Reforço · ${dataCurta(hoje.toISOString().slice(0, 10))}`}
        frase={novos.length ? <>{novos.length} aluno{novos.length > 1 ? "s" : ""} novo{novos.length > 1 ? "s" : ""} chegou{novos.length > 1 ? "aram" : ""} com o diagnóstico pronto.</> : "Nenhum aluno novo na fila."}
        detalhe={pronto ? <>A família de {pronto.aluno.nome.split(" ")[0]} já aprovou. O plano sugerido tem {pronto.plano.sessoes} sessões de {pronto.habilidade.nome}.</> : f.itens.length ? "Seus alunos em andamento estão logo abaixo, com a agenda da semana." : "Quando uma professora encaminhar um aluno para você, ele aparece aqui."}
      >
        {pronto && <a href={`#aluno-${pronto.id}`} className="botao-tinta">Montar o plano de {pronto.aluno.nome.split(" ")[0]}</a>}
      </Decisao>

      <section className="mt-16" aria-labelledby="agenda">
        <TituloSecao nota={`Semana de ${dataCurta(semana[0]!)} a ${dataCurta(semana[4]!)}`}><span id="agenda">Agenda</span></TituloSecao>
        <div className="folha grid grid-cols-1 sm:grid-cols-5">
          {semana.map((d) => {
            const doDia = sessoes.filter((s) => diaSP(s.inicio) === d);
            return (
              <div key={d} className="min-h-36 border-b border-pauta p-4 last:border-0 sm:border-b-0 sm:border-r">
                <p className="rotulo">{dataCurta(d)}</p>
                <ul className="mt-3 space-y-3">
                  {doDia.map((s) => (
                    <li key={s.id} className="border-l-2 border-escola pl-3">
                      <p className="num font-mono text-xs text-grafite">{hora(s.inicio)} · {s.modo}</p>
                      <p className="font-semibold">{s.aluno}</p>
                      <p className="text-sm text-grafite">{s.habilidade}, sessão {s.ordem}{s.total ? ` de ${s.total}` : ""}</p>
                    </li>
                  ))}
                  {doDia.length === 0 && <li className="text-sm text-grafite/70">Livre</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-16" aria-labelledby="fila">
        <TituloSecao nota="Ordem de chegada"><span id="fila">Fila de alunos</span></TituloSecao>
        <ol className="entra-lista space-y-5">
          {f.itens.map((i) => {
            const pendente = i.sessoes.find((s) => !s.registro && new Date(s.inicio) <= new Date());
            return (
              <li key={i.id} id={`aluno-${i.id}`} className="folha grid scroll-mt-28 gap-8 p-6 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <p className="rotulo">{STATUS[i.status]}</p>
                  <h3 className="mt-2 text-[1.6rem]">{i.aluno.nome}</h3>
                  <p className="text-sm text-grafite">{i.aluno.turma} · encaminhado por {i.pedidoPor} em {dataCurta(i.pedidoEm.slice(0, 10))}</p>
                  <div className="mt-4"><Regua valor={i.dominio} rotulo={`Domínio em ${i.habilidade.nome}`} /></div>
                  <PorQue motivos={i.motivos} score={i.score} />
                </div>
                <div className="lg:col-span-7">
                  <div className="pauta px-5">
                    <p className="font-semibold">Plano sugerido</p>
                    <p>{i.plano.sessoes} sessões de {i.plano.minutos ?? 50} minutos em {i.habilidade.nome} <CodigoBncc codigo={i.habilidade.codigo} /></p>
                    <p className="text-grafite">{i.habilidade.descricao}</p>
                    <p>Fecha com {i.plano.saida ?? "a mini-avaliação de saída"}.</p>
                  </div>
                  {i.sessoes.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm">
                      {i.sessoes.map((s, n) => (
                        <li key={s.id} className="border-l-2 border-pauta-forte pl-3">
                          <span className="font-mono text-xs text-grafite">Sessão {n + 1} · {dataCurta(diaSP(s.inicio))} {hora(s.inicio)} · {s.modo}</span>
                          {s.registro && <p>{s.registro}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-5 space-y-4">
                    {i.status === "AGUARDANDO_RESPONSAVEL" && <p className="text-sm text-grafite">O plano fica disponível quando a família aprovar.</p>}
                    {i.status === "APROVADO" && <Agendar pedidoId={i.id} sugestao={proximoHorario(f.horarios)} primeira />}
                    {i.status === "EM_ANDAMENTO" && (
                      <>
                        {pendente && <Registrar sessaoId={pendente.id} />}
                        <details className="group">
                          <summary className="link-sublinhado cursor-pointer list-none text-sm [&::-webkit-details-marker]:hidden">Agendar a próxima sessão</summary>
                          <div className="mt-3"><Agendar pedidoId={i.id} sugestao={proximoHorario(f.horarios)} primeira={false} /></div>
                        </details>
                        <Concluir pedidoId={i.id} />
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </Pagina>
  );
}

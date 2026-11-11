import type { Metadata } from "next";
import { demo } from "@escola/domain";
import { CodigoBncc, Decisao, Pagina, PorQue, Regua, SeloDemo, TituloSecao } from "@/components/caderno";
import { Confirmar } from "@/components/confirmar";
import { dataCurta } from "@/lib/formato";
import { nomeAluno, nomeHabilidade, primeiroNome, sessoesDoPlano } from "@/lib/dados";

export const metadata: Metadata = { title: "Agenda e fila de reforço" };

const STATUS = {
  "aguardando-responsavel": "Aguardando o responsável",
  aprovado: "Aprovado pela família",
  "em-andamento": "Em andamento",
} as const;

const plano = sessoesDoPlano;

export default function Reforco() {
  const fila = demo.TUTORING_QUEUE;
  const novos = fila.filter((f) => f.status !== "em-andamento");
  const pronto = novos.find((f) => f.status === "aprovado");
  const sessoes = demo.TUTOR_SESSIONS;
  const dias = ["seg", "ter", "qua", "qui", "sex"];

  return (
    <Pagina>
      <Decisao
        sobre={`Renato Siqueira · reforço de Matemática · ${dataCurta(demo.DEMO_TODAY)}`}
        frase={<>{novos.length} alunos novos chegaram com o diagnóstico pronto.</>}
        detalhe={
          pronto && (
            <>
              A família de {primeiroNome(pronto.studentId)} já aprovou. O plano sugerido tem{" "}
              {plano(demo.MASTERY[pronto.studentId]?.[pronto.skill] ?? 50)} sessões de {nomeHabilidade(pronto.skill)}.
            </>
          )
        }
      >
        {pronto && <a href={`#aluno-${pronto.studentId}`} className="botao-tinta">Montar o plano de {primeiroNome(pronto.studentId)}</a>}
      </Decisao>

      <section className="mt-16" aria-labelledby="agenda">
        <TituloSecao nota="Semana de 10 a 14 de novembro"><span id="agenda">Agenda</span></TituloSecao>
        <div className="folha grid grid-cols-1 sm:grid-cols-5">
          {dias.map((d) => {
            const doDia = sessoes.filter((s) => s.day === d);
            return (
              <div key={d} className="min-h-36 border-b border-pauta p-4 last:border-0 sm:border-b-0 sm:border-r">
                <p className="rotulo">{d}</p>
                <ul className="mt-3 space-y-3">
                  {doDia.map((s) => (
                    <li key={s.studentId + s.time} className="border-l-2 border-escola pl-3">
                      <p className="num font-mono text-xs text-grafite">{s.time} · {s.mode}</p>
                      <p className="font-semibold">{nomeAluno(s.studentId)}</p>
                      <p className="text-sm text-grafite">{nomeHabilidade(s.skill)}, sessão {s.number} de {s.of}</p>
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
          {fila.map((f) => {
            const dominio = demo.MASTERY[f.studentId]?.[f.skill] ?? 0;
            const alerta = demo.ALERTS.find((a) => a.studentId === f.studentId && a.skill === f.skill);
            const turma = demo.classById(demo.studentById(f.studentId)?.classId ?? "")?.name;
            const n = plano(dominio);
            return (
              <li key={f.studentId} id={`aluno-${f.studentId}`} className="folha grid scroll-mt-28 gap-8 p-6 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <p className="rotulo">{STATUS[f.status]}</p>
                  <h3 className="mt-2 text-[1.6rem]">{nomeAluno(f.studentId)}</h3>
                  <p className="text-sm text-grafite">
                    {turma} · encaminhado por {f.requestedBy} em {dataCurta(f.requestedAt)}
                  </p>
                  <div className="mt-4"><Regua valor={dominio} rotulo={`Domínio em ${nomeHabilidade(f.skill)}`} /></div>
                  {alerta && <PorQue motivos={alerta.reasons} score={alerta.score} />}
                </div>
                <div className="pauta -my-1 px-5 lg:col-span-7">
                  <p className="font-semibold">Plano sugerido</p>
                  <p>{n} sessões de 50 minutos em {nomeHabilidade(f.skill)} <CodigoBncc codigo={f.skill} /></p>
                  {(demo.LESSON_MATERIALS[f.skill] ?? []).map((m) => (
                    <p key={m.title} className="truncate text-grafite">↳ {m.title} — {m.pages}</p>
                  ))}
                  <p>Fecha quando acertar 4 de 5 na mini-avaliação de saída.</p>
                  <div className="-mx-5 bg-folha px-5 pb-1 pt-4 leading-normal">
                    {f.status === "aguardando-responsavel" ? (
                      <span className="text-sm text-grafite">O plano fica disponível quando a família aprovar.</span>
                    ) : f.status === "aprovado" ? (
                      <Confirmar rotulo="Aceitar plano e agendar" carimbo="Agendado" depois="Primeira sessão: qui, 13 nov, 14:00" />
                    ) : (
                      <Confirmar rotulo="Registrar a sessão de hoje" carimbo="Registrado" variante="linha" />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <SeloDemo />
    </Pagina>
  );
}

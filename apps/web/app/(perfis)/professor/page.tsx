import Link from "next/link";
import type { Metadata } from "next";
import { demo } from "@escola/domain";
import { Decisao, Pagina, PorQue, Regua, SeloDemo, TituloSecao, CodigoBncc } from "@/components/caderno";
import { Encaminhar } from "@/components/encaminhar";
import { MapaDeCalor } from "@/components/mapa-de-calor";
import { dataCurta, decimal } from "@/lib/formato";
import { listaNomes, nomeAluno, nomeHabilidade, opcoesDeReforco, primeiroNome } from "@/lib/dados";

export const metadata: Metadata = { title: "Quem precisa de você hoje" };

const TURMA = "6b";

export default function Professor() {
  const resumo = demo.DEMO_SUMMARY;
  const alertas = demo.alertsForClass(TURMA);
  const alunos = demo.studentsOfClass(TURMA);
  const prova = demo.REPORT;
  const problemas = prova.questions.filter((q) => q.flags.length > 0);
  const outraTurma = demo.alertsForClass("6a");

  return (
    <Pagina>
      <Decisao
        sobre={`6º ano B · Matemática · ${dataCurta(demo.DEMO_TODAY)}`}
        frase={resumo ? <>{resumo.sentence}.</> : "Ninguém precisa de reforço hoje."}
        detalhe={
          resumo && (
            <>
              {listaNomes(resumo.studentIds.map(primeiroNome))} acertaram menos nas 3 últimas atividades de{" "}
              {nomeHabilidade(resumo.skill)}.
              {opcoesDeReforco(resumo.skill)[0]?.horario &&
                ` ${opcoesDeReforco(resumo.skill)[0]!.nome} tem horário livre ${opcoesDeReforco(resumo.skill)[0]!.horario}.`}
            </>
          )
        }
      >
        {resumo && (
          <Encaminhar
            alunos={resumo.studentIds.map(primeiroNome)}
            habilidade={nomeHabilidade(resumo.skill)}
            opcoes={opcoesDeReforco(resumo.skill)}
            rotulo={`Encaminhar os ${resumo.count}`}
          />
        )}
        <Link href="/professor/prova" className="botao-linha">Ver a prova corrigida</Link>
      </Decisao>

      <div className="mt-16 grid gap-12 lg:grid-cols-12">
        <section className="lg:col-span-8" aria-labelledby="quem">
          <TituloSecao nota={`${alertas.length} alertas abertos`}>
            <span id="quem">Quem precisa de você hoje</span>
          </TituloSecao>
          <ol className="entra-lista divide-y divide-pauta">
            {alertas.map((a) => (
              <li key={a.studentId + a.skill} className="grid gap-x-6 gap-y-2 py-5 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-serif text-[1.35rem] leading-snug">{a.headline}</p>
                  <p className="mt-1 text-sm text-grafite">
                    {nomeAluno(a.studentId)} · <CodigoBncc codigo={a.skill} />
                  </p>
                  <PorQue motivos={a.reasons} score={a.score} />
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <Regua valor={a.mastery} rotulo={`Domínio em ${nomeHabilidade(a.skill)}`} />
                  <Encaminhar
                    alunos={[primeiroNome(a.studentId)]}
                    habilidade={nomeHabilidade(a.skill)}
                    opcoes={opcoesDeReforco(a.skill)}
                    variante="linha"
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="space-y-6 lg:col-span-4">
          <div className="adesivo p-5">
            <p className="rotulo text-tinta/70">Prova corrigida</p>
            <p className="mt-2 font-serif text-[1.3rem] leading-snug">
              Média <span className="num">{decimal(prova.average)}</span>. {problemas.length} questões merecem uma segunda olhada.
            </p>
            <Link href="/professor/prova" className="link-sublinhado mt-3 inline-block text-sm font-semibold">
              Abrir relatório por questão
            </Link>
          </div>
          <div className="folha p-5">
            <p className="rotulo">Outra turma</p>
            <p className="mt-2">
              <strong>6º ano A</strong>: {outraTurma.length === 0 ? "nenhum alerta" : `${outraTurma.length} aluno precisa de apoio em ${nomeHabilidade(outraTurma[0]!.skill)}`}.
            </p>
          </div>
          <div className="folha p-5 text-sm text-grafite">
            <p className="rotulo">Como o alerta funciona</p>
            <p className="mt-2">
              Todo dia comparamos as 3 últimas atividades de cada habilidade com as anteriores, junto com frequência e tarefas.
              O alerta chega enquanto o domínio ainda está em progresso, antes de virar nota baixa. Domínio baixo e estável
              aparece no mapa da turma. Ninguém muda nota ou turma automaticamente: a decisão é sua.
            </p>
          </div>
        </aside>
      </div>

      <section className="mt-16" aria-labelledby="mapa">
        <TituloSecao nota="Domínio de 0 a 100, recalculado a cada atividade">
          <span id="mapa">Mapa da turma</span>
        </TituloSecao>
        <MapaDeCalor
          alunos={alunos.map((a) => ({ id: a.id, nome: a.name }))}
          habilidades={demo.SKILLS}
          dominio={demo.MASTERY}
          destaque={new Set(alertas.map((a) => a.studentId))}
        />
      </section>

      <SeloDemo />
    </Pagina>
  );
}

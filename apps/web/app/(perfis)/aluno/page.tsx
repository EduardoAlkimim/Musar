import type { Metadata } from "next";
import { demo } from "@escola/domain";
import { Pagina, SeloDemo } from "@/components/caderno";
import { Confirmar } from "@/components/confirmar";
import { Revisao, type ItemRevisao } from "@/components/revisao";
import { dataCurta, letra } from "@/lib/formato";
import { nomeHabilidade, opcoesDeReforco } from "@/lib/dados";

export const metadata: Metadata = { title: "Seu próximo passo" };

const PARECIDA: ItemRevisao = {
  enunciado: "Agora tente esta: quanto é 1/2 de 2/5?",
  correta: 1,
  opcoes: [
    { texto: "3/7", retorno: "Você somou em cima e embaixo. “Fração de uma fração” é multiplicação: 1×2 sobre 2×5." },
    { texto: "1/5", retorno: "Isso. 1×2 = 2 e 2×5 = 10, então 2/10, que simplificado dá 1/5. Você fechou o passo de hoje." },
    { texto: "2/10", retorno: "A conta está certa, falta simplificar: 2/10 e 1/5 são a mesma fração. Qual das alternativas é a forma simplificada?" },
    { texto: "5/4", retorno: "Parece que você dividiu em vez de multiplicar. Releia a Aula 23, p. 101, e tente de novo." },
  ],
};

export default function Aluno() {
  const aluno = demo.studentById(demo.GUARDIAN.childId)!;
  const nome = aluno.name.split(" ")[0]!;
  const resultado = demo.REPORT.students.find((r) => r.studentId === aluno.id)!;
  const q9 = demo.ASSESSMENT.questions.find((q) => q.number === 9)!;
  const resposta = demo.ANSWERS.find((a) => a.studentId === aluno.id && a.questionId === q9.id)?.chosen ?? null;
  const tutor = opcoesDeReforco(q9.skill)[0]!;

  return (
    <Pagina className="max-w-[34rem]">
      <p className="rotulo entra">Oi, {nome} · {dataCurta(demo.DEMO_TODAY)}</p>
      <h1 className="entra mt-4 text-[2.6rem]">Seu próximo passo leva 10 minutos.</h1>
      <p className="entra mt-3 text-[1.05rem] text-grafite">Revisar uma questão de {nomeHabilidade(q9.skill)} da prova de sexta.</p>

      <section className="folha entra mt-8 overflow-hidden" aria-labelledby="erro">
        <div className="border-b border-pauta px-5 py-4">
          <p className="rotulo">Questão {q9.number} da prova</p>
          <h2 id="erro" className="mt-2 text-[1.35rem]">{q9.statement}</h2>
          <p className="mt-3 text-sm">
            Você marcou <strong className="font-mono">{resposta === null ? "em branco" : `${letra(resposta)}) ${q9.options[resposta]}`}</strong>. A certa é{" "}
            <strong className="font-mono text-escola">{letra(q9.correct)}) {q9.options[q9.correct]}</strong>.
          </p>
        </div>
        <div className="pauta px-5">
          <p className="font-semibold">Por que errei?</p>
          <p>“De” em fração quer dizer multiplicar.</p>
          <p>2/3 de 3/4 = (2×3) / (3×4) = 6/12 = 1/2.</p>
          <p className="text-grafite">Está na Aula 23 — Fração de uma fração, apostila p. 100–103.</p>
        </div>
        <div className="px-5 py-5">
          <Revisao item={PARECIDA} />
        </div>
      </section>

      <section className="mt-12" aria-labelledby="duvida">
        <h2 id="duvida" className="text-[1.45rem]">Dúvida sobre a aula?</h2>
        <p className="mt-1 text-sm text-grafite">As respostas vêm só do material da professora Marta. Se não estiver lá, a dúvida vai para ela.</p>
        <div className="mt-4 space-y-3">
          <p className="ml-10 rounded-[3px] bg-areia/70 px-4 py-3">Por que não posso somar 2/3 com 3/4 direto?</p>
          <div className="folha px-4 py-3">
            <p>Porque os pedaços têm tamanhos diferentes: terços e quartos. Antes de somar, a gente troca as duas frações por outras equivalentes com o mesmo denominador, 12: 8/12 + 9/12 = 17/12.</p>
            <p className="mt-2 font-mono text-xs text-grafite">Fonte: Aula 22 — Soma de frações, apostila p. 96</p>
          </div>
          <form className="flex gap-2">
            <label htmlFor="pergunta" className="sr-only">Sua dúvida</label>
            <input id="pergunta" className="min-h-12 flex-1 rounded-[3px] border border-pauta bg-folha px-4 text-base focus:outline-none focus-visible:border-escola" placeholder="Escreva sua dúvida sobre a aula" />
            <button type="button" className="botao-linha">Enviar</button>
          </form>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="reforco">
        <h2 id="reforco" className="text-[1.45rem]">Reforço em {nomeHabilidade(q9.skill)}</h2>
        <p className="mt-2">Com {tutor.nome}, {tutor.horario}. Sua mãe precisa aprovar antes.</p>
        <div className="mt-4"><Confirmar rotulo="Pedir para minha mãe aprovar" carimbo="Pedido enviado" variante="linha" /></div>
      </section>

      <section className="mt-12" aria-labelledby="agenda">
        <h2 id="agenda" className="text-[1.45rem]">Agenda</h2>
        <ul className="mt-3 divide-y divide-pauta border-y border-pauta">
          {demo.CLASS_SCHEDULE.map((c) => (
            <li key={c.what} className="grid grid-cols-[5.5rem_1fr] gap-3 py-3">
              <span className="num font-mono text-sm text-grafite">{c.when}</span>
              <span>{c.what} <span className="text-grafite">· {c.where}</span></span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-grafite">Nota na última prova: <span className="num font-mono text-tinta">{resultado.score.toFixed(1).replace(".", ",")}</span></p>
      </section>

      <SeloDemo />
    </Pagina>
  );
}

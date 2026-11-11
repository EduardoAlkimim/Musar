import type { Metadata } from "next";
import { demo } from "@escola/domain";
import { Pagina, SeloDemo } from "@/components/caderno";
import { Confirmar } from "@/components/confirmar";
import { pct } from "@/lib/formato";
import { nomeHabilidade, opcoesDeReforco, sessoesDoPlano } from "@/lib/dados";

export const metadata: Metadata = { title: "Resumo da semana" };

const DICAS: Record<string, string[]> = {
  EF06MA07: [
    "Na hora do lanche, divida uma pizza ou um bolo e pergunte: “que fração cada um comeu?”",
    "Peça para ele comparar 1/2 e 1/3 de uma barra de chocolate antes de dividir.",
    "Ao seguir uma receita, dobre ou corte pela metade as medidas juntos.",
  ],
};

export default function Familia() {
  const filho = demo.studentById(demo.GUARDIAN.childId)!;
  const nome = filho.name.split(" ")[0]!;
  const alerta = demo.ALERTS.find((a) => a.studentId === filho.id)!;
  const sinais = demo.SIGNALS.find((s) => s.studentId === filho.id)!;
  const dominio = demo.MASTERY[filho.id]!;
  const fortes = Object.entries(dominio).sort((a, b) => b[1] - a[1]).slice(0, 2);
  const tutor = opcoesDeReforco(alerta.skill)[0]!;
  const nota = demo.REPORT.students.find((r) => r.studentId === filho.id)!;
  const ev = sinais.evidence.filter((e) => e.skill === alerta.skill);
  const antes = ev.slice(0, -3).reduce((s, e) => s + e.correct / e.total, 0) / Math.max(1, ev.length - 3);
  const agora = ev.slice(-3).reduce((s, e) => s + e.correct / e.total, 0) / 3;

  return (
    <Pagina className="max-w-[34rem]">
      <p className="rotulo entra">Olá, {demo.GUARDIAN.name} · semana de 3 a 9 de novembro</p>
      <h1 className="entra mt-4 text-[2.4rem]">{nome} precisa de apoio em {nomeHabilidade(alerta.skill)}.</h1>
      <p className="entra mt-4 text-[1.05rem] text-grafite">
        Nas 3 últimas atividades, os acertos em {nomeHabilidade(alerta.skill)} foram de {pct(antes)} para {pct(agora)}.
        A professora Marta sugeriu reforço com {tutor.nome}, {tutor.horario}, {tutor.modo}.
      </p>

      <div className="folha entra mt-7 p-5">
        <p className="font-semibold">Reforço em {nomeHabilidade(alerta.skill)}</p>
        <p className="text-sm text-grafite">{sessoesDoPlano(alerta.mastery)} sessões de 50 minutos, com mini-avaliação no fim</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Confirmar rotulo="Aprovar o reforço" carimbo="Aprovado" depois={`Primeira sessão: ${tutor.horario}`} />
          <a href="#falar" className="botao-linha">Falar com a professora</a>
        </div>
      </div>

      <section className="mt-12" aria-labelledby="semana">
        <h2 id="semana" className="text-[1.45rem]">A semana de {nome}</h2>
        <dl className="pauta mt-3 px-5 py-1">
          <div className="flex justify-between"><dt>Frequência</dt><dd className="num font-mono">{pct(sinais.attendance)}</dd></div>
          <div className="flex justify-between"><dt>Prova de Matemática</dt><dd className="num font-mono">{nota.score.toFixed(1).replace(".", ",")} de 10</dd></div>
          <div className="flex justify-between"><dt>Tarefas não entregues</dt><dd className="num font-mono">{sinais.missingTasks}</dd></div>
          <div><dt>Vai bem em</dt><dd className="font-serif text-[1.1rem] italic">{fortes.map(([c]) => nomeHabilidade(c)).join(" e ")}</dd></div>
        </dl>
      </section>

      {DICAS[alerta.skill] && (
        <section className="mt-12" aria-labelledby="casa">
          <h2 id="casa" className="text-[1.45rem]">Como ajudar em casa</h2>
          <ol className="mt-4 space-y-4">
            {DICAS[alerta.skill]!.map((d, i) => (
              <li key={d} className="grid grid-cols-[2rem_1fr] gap-2">
                <span className="num font-serif text-[1.6rem] leading-none text-escola">{i + 1}</span>
                <span>{d}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-12" aria-labelledby="vem">
        <h2 id="vem" className="text-[1.45rem]">O que vem por aí</h2>
        <ul className="mt-3 divide-y divide-pauta border-y border-pauta">
          {demo.CLASS_SCHEDULE.map((c) => (
            <li key={c.what} className="grid grid-cols-[5.5rem_1fr] gap-3 py-3">
              <span className="num font-mono text-sm text-grafite">{c.when}</span>
              <span>{c.what}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="falar" className="mt-12 scroll-mt-28" aria-labelledby="msg">
        <h2 id="msg" className="text-[1.45rem]">Mensagem para a professora Marta</h2>
        <form className="mt-3">
          <label htmlFor="mensagem" className="sr-only">Mensagem</label>
          <textarea id="mensagem" rows={4} className="pauta w-full resize-y rounded-[3px] border border-pauta px-4 text-base focus:outline-none focus-visible:border-escola" placeholder="Escreva sua mensagem" />
          <div className="mt-3"><Confirmar rotulo="Enviar" carimbo="Enviado" depois="Resposta em até 2 dias úteis" variante="linha" /></div>
        </form>
      </section>

      <p className="mt-12 text-xs text-grafite">
        Você autorizou o uso dos dados escolares de {nome} em 3 fev 2026 (termo v1.2). Pode pedir a exportação ou a exclusão a qualquer momento.
      </p>
      <SeloDemo />
    </Pagina>
  );
}

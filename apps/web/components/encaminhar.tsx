"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, X } from "@phosphor-icons/react";
import clsx from "clsx";

export interface OpcaoTutor {
  id: string;
  nome: string;
  score: number;
  motivos: string[];
  horario: string | null;
  modo: string;
}

/**
 * Encaminhar ao reforço em um clique: o sistema sugere os 3 melhores e explica o porquê.
 * A decisão é da professora; o responsável aprova depois (aluno menor de idade).
 */
export function Encaminhar({
  alunos,
  habilidade,
  opcoes,
  rotulo = "Encaminhar",
  variante = "tinta",
}: {
  alunos: string[];
  habilidade: string;
  opcoes: OpcaoTutor[];
  rotulo?: string;
  variante?: "tinta" | "linha";
}) {
  const [escolhido, setEscolhido] = useState(opcoes[0]?.id ?? "");
  const [feito, setFeito] = useState(false);
  const [aberto, setAberto] = useState(false);
  const tutor = opcoes.find((o) => o.id === escolhido);
  const quem = alunos.length === 1 ? alunos[0] : `${alunos.length} alunos`;

  if (feito) {
    return (
      <span className="inline-flex items-center gap-3">
        <span className="carimbo">Encaminhado</span>
        <span className="text-sm text-grafite">Para {tutor?.nome}. Aguardando o responsável.</span>
      </span>
    );
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={setAberto}>
      <Dialog.Trigger className={variante === "tinta" ? "botao-tinta" : "botao-linha"}>
        {rotulo}
        <ArrowRight aria-hidden size={16} weight="bold" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-tinta/30" />
        <Dialog.Content className="folha fixed inset-x-3 bottom-3 z-50 max-h-[88dvh] overflow-y-auto p-6 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[34rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="rotulo">Reforço em {habilidade}</p>
              <Dialog.Title className="mt-2 font-serif text-[1.8rem] leading-tight">Encaminhar {quem}</Dialog.Title>
            </div>
            <Dialog.Close className="-m-2 p-2 text-grafite hover:text-tinta" aria-label="Fechar">
              <X size={20} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-sm text-grafite">
            Os 3 professores mais indicados, pela especialidade, pela agenda e pelos resultados com alunos parecidos.
          </Dialog.Description>

          <fieldset className="mt-6 space-y-2">
            <legend className="sr-only">Professor de reforço</legend>
            {opcoes.map((o, i) => (
              <label
                key={o.id}
                className={clsx(
                  "block cursor-pointer rounded-[3px] border p-4 transition-colors",
                  escolhido === o.id ? "border-tinta bg-papel" : "border-pauta hover:border-pauta-forte",
                )}
              >
                <span className="flex items-baseline gap-3">
                  <input
                    type="radio"
                    name="tutor"
                    value={o.id}
                    checked={escolhido === o.id}
                    onChange={() => setEscolhido(o.id)}
                    className="translate-y-0.5 accent-[var(--color-escola)]"
                  />
                  <span className="font-semibold">{o.nome}</span>
                  {i === 0 && <span className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-escola">mais indicado</span>}
                  <span className="num ml-auto font-mono text-xs text-grafite">{o.score}/100</span>
                </span>
                <span className="mt-1.5 block pl-7 text-sm text-grafite">{o.motivos.join(" · ")}</span>
                <span className="mt-1 block pl-7 text-sm">
                  {o.horario ? `Próximo horário: ${o.horario}` : "Sem horário livre esta semana"} · {o.modo}
                </span>
              </label>
            ))}
          </fieldset>

          <p className="mt-5 text-sm text-grafite">
            O responsável recebe o pedido e aprova antes da primeira sessão.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Dialog.Close className="botao-linha">Cancelar</Dialog.Close>
            <button
              type="button"
              className="botao-tinta"
              onClick={() => {
                setAberto(false);
                setFeito(true);
              }}
            >
              Encaminhar para {tutor?.nome.split(" ")[0]}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

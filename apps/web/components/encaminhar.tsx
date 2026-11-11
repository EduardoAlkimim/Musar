"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Star, X } from "lucide-react";
import clsx from "clsx";
import { encaminhar, type Resultado } from "@/app/(app)/acoes";

export interface OpcaoTutor {
  id: string;
  nome: string;
  /** Pontuação do sistema (0 a 100) quando é sugestão. */
  score?: number;
  motivos?: string[];
  horario?: string | null;
  modo?: string;
  especialidades?: string[];
  horarios?: string[];
  carga?: number;
  taxa?: number | null;
}

/**
 * Indicar professor de reforço. O sistema sugere os mais indicados e explica o porquê,
 * mas quem decide pode escolher QUALQUER professor de reforço da escola.
 */
export function Encaminhar({
  alertas,
  habilidade,
  opcoes,
  outros = [],
  rotulo = "Indicar reforço",
  variante = "primario",
}: {
  alertas: { id: string; nome: string }[];
  habilidade: string;
  /** Sugeridos pelo sistema, do mais indicado para o menos. */
  opcoes: OpcaoTutor[];
  /** Os demais professores de reforço da escola. */
  outros?: OpcaoTutor[];
  rotulo?: string;
  variante?: "primario" | "secundario" | "pequeno";
}) {
  const [escolhido, setEscolhido] = useState(opcoes[0]?.id ?? outros[0]?.id ?? "");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const todos = [...opcoes, ...outros];
  const tutor = todos.find((o) => o.id === escolhido);
  const quem = alertas.length === 1 ? alertas[0]!.nome : `${alertas.length} alunos`;

  if (resultado?.ok) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2" role="status">
        <span className="carimbo">Indicado</span>
        <span className="text-xs text-suave">{resultado.mensagem}</span>
      </span>
    );
  }
  if (todos.length === 0) return <span className="text-xs text-suave">Nenhum professor de reforço cadastrado.</span>;

  function confirmar() {
    iniciar(async () => {
      let ultimo: Resultado = { ok: false, erro: "Nada foi enviado" };
      for (const a of alertas) {
        ultimo = await encaminhar(a.id, escolhido);
        if (!ultimo.ok) break;
      }
      setResultado(ultimo);
      if (ultimo.ok) setAberto(false);
    });
  }

  const Opcao = ({ o, sugerido, primeiro }: { o: OpcaoTutor; sugerido: boolean; primeiro?: boolean }) => (
    <label className={clsx("block cursor-pointer rounded-[12px] border p-3.5 transition-colors", escolhido === o.id ? "border-azul bg-azul-fundo" : "border-borda hover:border-azul-claro")}>
      <span className="flex flex-wrap items-center gap-2">
        <input type="radio" name="tutor" value={o.id} checked={escolhido === o.id} onChange={() => setEscolhido(o.id)} className="accent-[var(--color-azul)]" />
        <span className="font-semibold text-marinho">{o.nome}</span>
        {sugerido && primeiro && <span className="badge badge-ouro"><Star className="size-3" /> Mais indicado</span>}
        {sugerido && !primeiro && <span className="badge badge-info">Sugerido</span>}
        {o.score !== undefined && <span className="num ml-auto text-xs text-suave">{o.score}/100</span>}
      </span>
      <span className="mt-1 block pl-6 text-[0.82rem] text-suave">
        {o.motivos?.length ? o.motivos.join(" · ") : [o.especialidades?.length ? `Especialidades: ${o.especialidades.join(", ")}` : null, o.taxa !== null && o.taxa !== undefined ? `${o.taxa}% fecharam o reforço` : null].filter(Boolean).join(" · ")}
      </span>
      <span className="mt-0.5 block pl-6 text-[0.82rem]">
        {o.horario ? `Próximo horário: ${o.horario}` : o.horarios?.length ? `Horários: ${o.horarios.join(", ")}` : "Sem horário livre informado"}
        {o.modo ? ` · ${o.modo}` : ""}
        {o.carga !== undefined ? ` · ${o.carga} aluno${o.carga === 1 ? "" : "s"} agora` : ""}
      </span>
    </label>
  );

  return (
    <Dialog.Root open={aberto} onOpenChange={setAberto}>
      <Dialog.Trigger className={clsx("btn", variante === "primario" ? "btn-primario" : variante === "secundario" ? "btn-secundario" : "btn-secundario btn-pequeno")}>
        {rotulo} <ArrowRight className="size-3.5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-marinho/40" />
        <Dialog.Content className="card fixed inset-x-3 bottom-3 z-50 max-h-[90dvh] overflow-y-auto p-6 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[36rem] sm:-translate-x-1/2 sm:-translate-y-1/2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="rotulo">Reforço em {habilidade}</p>
              <Dialog.Title className="mt-1 font-titulo text-[1.35rem] font-semibold text-marinho">Indicar professor para {quem}</Dialog.Title>
            </div>
            <Dialog.Close className="-m-2 rounded-md p-2 text-suave hover:bg-azul-fundo" aria-label="Fechar"><X className="size-5" /></Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-suave">
            O MUSAR sugere pela especialidade, pela agenda e pelos resultados. Você pode escolher qualquer professor de reforço da escola.
          </Dialog.Description>

          <fieldset className="mt-5 space-y-2">
            <legend className="rotulo mb-2">Sugeridos</legend>
            {opcoes.map((o, i) => <Opcao key={o.id} o={o} sugerido primeiro={i === 0} />)}
            {opcoes.length === 0 && <p className="text-sm text-suave">Nenhuma sugestão para esta habilidade.</p>}
          </fieldset>
          {outros.length > 0 && (
            <fieldset className="mt-5 space-y-2">
              <legend className="rotulo mb-2">Outros professores de reforço</legend>
              {outros.map((o) => <Opcao key={o.id} o={o} sugerido={false} />)}
            </fieldset>
          )}

          <p className="mt-5 text-xs text-suave">Aluno menor de idade: o responsável aprova antes da primeira sessão.</p>
          {resultado && !resultado.ok && <p role="alert" className="mt-2 text-sm text-perigo">{resultado.erro}</p>}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Dialog.Close className="btn btn-secundario">Cancelar</Dialog.Close>
            <button type="button" className="btn btn-primario" disabled={pendente || !escolhido} onClick={confirmar}>
              {pendente ? "Indicando…" : `Indicar ${tutor?.nome.split(" ")[0] ?? ""}`}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

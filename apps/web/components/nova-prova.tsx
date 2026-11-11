"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { criarProva } from "@/app/(app)/acoes";

const LETRAS = ["A", "B", "C", "D"];
type Q = { habilidadeId: string; enunciado: string; alternativas: string[]; gabarito: number; distratores: Record<number, string>; aberta: boolean };
type Atrib = { id: string; turma: string; materia: string; habilidades: { id: string; codigo: string; nome: string }[] };

const vazia = (habilidadeId: string): Q => ({ habilidadeId, enunciado: "", alternativas: ["", "", "", ""], gabarito: 0, distratores: {}, aberta: false });

export function NovaProva({ atribuicoes }: { atribuicoes: Atrib[] }) {
  const [atribId, setAtribId] = useState(atribuicoes[0]?.id ?? "");
  const atrib = atribuicoes.find((a) => a.id === atribId);
  const primeira = atrib?.habilidades[0]?.id ?? "";
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState("PROVA");
  const [qs, setQs] = useState<Q[]>(() => Array.from({ length: 5 }, () => vazia(primeira)));
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();

  if (!atrib) return <p className="text-grafite">Você ainda não tem turmas atribuídas.</p>;
  const muda = (i: number, p: Partial<Q>) => setQs(qs.map((q, j) => (j === i ? { ...q, ...p } : q)));

  function salvar() {
    setErro(null);
    if (titulo.trim().length < 3) return setErro("Dê um título para a prova.");
    iniciar(async () => {
      const r = await criarProva({
        atribuicaoId: atribId,
        titulo,
        data,
        tipo,
        questoes: qs.map((q) => ({
          enunciado: q.enunciado,
          alternativas: q.alternativas.map((a, i) => a.trim() || LETRAS[i]!),
          gabarito: q.gabarito,
          habilidadeId: q.habilidadeId,
          distratores: Object.fromEntries(Object.entries(q.distratores).filter(([k, v]) => v.trim() && Number(k) !== q.gabarito)),
        })),
      });
      if (!r.ok) return setErro(r.erro);
      router.push(`/professor/provas/${r.id}/respostas`);
    });
  }

  const campo = "h-11 rounded-[3px] border border-pauta bg-folha px-3 text-base focus:outline-none focus-visible:border-escola";
  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-[1.2fr_2fr_auto_auto]">
        <label className="grid gap-1.5 text-sm">
          <span className="rotulo">Turma e matéria</span>
          <select className={campo} value={atribId} onChange={(e) => { setAtribId(e.target.value); const h = atribuicoes.find((a) => a.id === e.target.value)?.habilidades[0]?.id ?? ""; setQs(qs.map((q) => ({ ...q, habilidadeId: h }))); }}>
            {atribuicoes.map((a) => <option key={a.id} value={a.id}>{a.turma} · {a.materia}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="rotulo">Título</span>
          <input className={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Avaliação do 4º bimestre" />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="rotulo">Data</span>
          <input type="date" className={campo} value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="rotulo">Tipo</span>
          <select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="PROVA">Prova</option>
            <option value="SIMULADO">Simulado</option>
            <option value="TAREFA">Tarefa</option>
          </select>
        </label>
      </div>

      <ol className="divide-y divide-pauta border-y border-pauta">
        {qs.map((q, i) => (
          <li key={i} className="grid gap-4 py-5 lg:grid-cols-[2.5rem_1fr_14rem_auto]">
            <span className="num font-serif text-[1.8rem] leading-none">{i + 1}</span>
            <div className="grid gap-2">
              <input aria-label={`Enunciado da questão ${i + 1}`} className={campo} value={q.enunciado} onChange={(e) => muda(i, { enunciado: e.target.value })} placeholder="Enunciado (opcional)" />
              {q.aberta && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.alternativas.map((a, j) => (
                    <div key={j} className="grid gap-1">
                      <input aria-label={`Alternativa ${LETRAS[j]}`} className={campo} value={a} onChange={(e) => muda(i, { alternativas: q.alternativas.map((x, k) => (k === j ? e.target.value : x)) })} placeholder={`${LETRAS[j]})`} />
                      {j !== q.gabarito && (
                        <input aria-label={`O que a alternativa ${LETRAS[j]} revela`} className={clsx(campo, "h-9 text-sm")} value={q.distratores[j] ?? ""} onChange={(e) => muda(i, { distratores: { ...q.distratores, [j]: e.target.value } })} placeholder={`Quem marca ${LETRAS[j]}… (ex.: soma os denominadores)`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button type="button" className="link-sublinhado justify-self-start text-sm text-grafite" onClick={() => muda(i, { aberta: !q.aberta })}>
                {q.aberta ? "Esconder alternativas" : "Escrever alternativas e o que cada erro revela"}
              </button>
            </div>
            <select aria-label={`Habilidade da questão ${i + 1}`} className={campo} value={q.habilidadeId} onChange={(e) => muda(i, { habilidadeId: e.target.value })}>
              {atrib.habilidades.map((h) => <option key={h.id} value={h.id}>{h.codigo} · {h.nome}</option>)}
            </select>
            <fieldset className="flex items-center gap-1">
              <legend className="sr-only">Gabarito da questão {i + 1}</legend>
              {LETRAS.map((l, j) => (
                <label key={l} className={clsx("grid size-11 cursor-pointer place-items-center rounded-[3px] border font-mono", q.gabarito === j ? "border-escola bg-escola text-folha" : "border-pauta hover:border-pauta-forte")}>
                  <input type="radio" className="sr-only" name={`g-${i}`} checked={q.gabarito === j} onChange={() => muda(i, { gabarito: j })} />
                  {l}
                </label>
              ))}
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="botao-linha" onClick={() => setQs([...qs, vazia(primeira)])}>+ 1 questão</button>
        <button type="button" className="botao-linha" onClick={() => setQs([...qs, ...Array.from({ length: 5 }, () => vazia(primeira))])}>+ 5 questões</button>
        {qs.length > 1 && <button type="button" className="botao-linha" onClick={() => setQs(qs.slice(0, -1))}>Tirar a última</button>}
        <span className="ml-auto" />
        <button type="button" className="botao-tinta disabled:opacity-60" disabled={pendente} onClick={salvar}>
          {pendente ? "Salvando…" : `Salvar prova com ${qs.length} questões`}
        </button>
      </div>
      {erro && <p role="alert" className="text-sm text-alerta">{erro}</p>}
    </div>
  );
}

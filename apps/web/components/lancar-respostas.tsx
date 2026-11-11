"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { lancarRespostas } from "@/app/(app)/acoes";

const LETRAS = "ABCDE";

/**
 * Lançamento rápido: uma linha por aluno, digita as letras marcadas em sequência (ex.: ACBDA…).
 * Traço ou espaço = em branco. Funciona inteiro pelo teclado: Enter desce para o próximo aluno.
 */
export function LancarRespostas({
  provaId,
  questoes,
  alunos,
}: {
  provaId: string;
  questoes: { numero: number; alternativas: number; gabarito: number }[];
  alunos: { id: string; nome: string; respostas: (number | null | undefined)[] }[];
}) {
  const inicial = useMemo(
    () => Object.fromEntries(alunos.map((a) => [a.id, a.respostas.every((r) => r === undefined) ? "" : a.respostas.map((r) => (r === undefined || r === null ? "-" : LETRAS[r])).join("")])),
    [alunos],
  );
  const [linhas, setLinhas] = useState<Record<string, string>>(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  const gabarito = questoes.map((q) => LETRAS[q.gabarito]).join("");

  const invalida = (texto: string) =>
    [...texto].some((c, i) => {
      const q = questoes[i];
      if (!q) return true;
      if (c === "-" || c === " ") return false;
      const idx = LETRAS.indexOf(c);
      return idx < 0 || idx >= q.alternativas;
    });
  const preenchidas = alunos.filter((a) => (linhas[a.id] ?? "") !== "").length;

  function salvar() {
    setErro(null);
    const respostas = alunos.flatMap((a) => {
      const t = linhas[a.id] ?? "";
      if (t === "" || t === inicial[a.id]) return [];
      return [...t].map((c, i) => ({ alunoId: a.id, numero: questoes[i]!.numero, marcada: c === "-" || c === " " ? null : LETRAS.indexOf(c) }));
    });
    if (respostas.length === 0) return setErro("Nada mudou desde a última vez.");
    iniciar(async () => {
      const r = await lancarRespostas(provaId, respostas);
      if (!r.ok) return setErro(r.erro);
      router.push(`/professor/provas/${provaId}`);
    });
  }

  return (
    <div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="border-b border-borda">
              <th className="px-4 py-3 text-left font-normal"><span className="rotulo">Aluno</span></th>
              <th className="px-4 py-3 text-left font-normal">
                <span className="rotulo">Respostas, questão 1 a {questoes.length}</span>
                <span className="mt-1 block font-mono text-xs tracking-[0.35em] text-azul" title="Gabarito">{gabarito}</span>
              </th>
              <th className="px-4 py-3 text-right font-normal"><span className="rotulo">Acertos</span></th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((a, i) => {
              const t = linhas[a.id] ?? "";
              const ruim = invalida(t);
              const acertos = [...t].filter((c, j) => LETRAS.indexOf(c) === questoes[j]?.gabarito).length;
              return (
                <tr key={a.id} className="border-b border-borda/70 last:border-0">
                  <td className="px-4 py-2"><label htmlFor={`r-${a.id}`}>{a.nome}</label></td>
                  <td className="px-4 py-2">
                    <input
                      id={`r-${a.id}`}
                      value={t}
                      maxLength={questoes.length}
                      autoComplete="off"
                      spellCheck={false}
                      inputMode="text"
                      aria-invalid={ruim}
                      onChange={(e) => setLinhas({ ...linhas, [a.id]: e.target.value.toUpperCase() })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          document.getElementById(`r-${alunos[i + 1]?.id}`)?.focus();
                        }
                      }}
                      className={clsx("h-10 w-full rounded-[10px] border bg-[#f7fafc] px-3 font-mono text-base tracking-[0.35em] uppercase focus:outline-none focus-visible:border-azul", ruim ? "border-perigo" : "border-borda")}
                    />
                  </td>
                  <td className="num px-4 py-2 text-right font-mono text-suave">{t ? `${acertos}/${questoes.length}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" className="btn btn-primario disabled:opacity-60" disabled={pendente || alunos.some((a) => invalida(linhas[a.id] ?? ""))} onClick={salvar}>
          {pendente ? "Corrigindo…" : "Salvar e corrigir"}
        </button>
        <span className="text-sm text-suave">{preenchidas} de {alunos.length} alunos com respostas · traço (-) = em branco · Enter vai para o próximo</span>
      </div>
      {erro && <p role="alert" className="mt-3 text-sm text-perigo">{erro}</p>}
    </div>
  );
}

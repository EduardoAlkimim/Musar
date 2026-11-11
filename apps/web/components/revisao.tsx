"use client";

import { useState } from "react";
import clsx from "clsx";

export interface ItemRevisao {
  enunciado: string;
  opcoes: { texto: string; retorno: string }[];
  correta: number;
}

/** Revisão do erro: uma questão parecida, com retorno específico para cada alternativa. */
export function Revisao({ item }: { item: ItemRevisao }) {
  const [marcada, setMarcada] = useState<number | null>(null);
  const acertou = marcada === item.correta;

  return (
    <div>
      <p className="font-serif text-[1.25rem] leading-snug">{item.enunciado}</p>
      <div role="radiogroup" aria-label="Alternativas" className="mt-4 grid grid-cols-2 gap-2">
        {item.opcoes.map((o, i) => (
          <button
            key={o.texto}
            type="button"
            role="radio"
            aria-checked={marcada === i}
            disabled={acertou}
            onClick={() => setMarcada(i)}
            className={clsx(
              "min-h-12 rounded-[3px] border px-4 text-left font-mono text-[1.05rem] transition-colors",
              marcada === i && i === item.correta && "border-escola bg-escola-claro",
              marcada === i && i !== item.correta && "border-tinta bg-areia",
              marcada !== i && "border-pauta bg-folha hover:border-pauta-forte",
            )}
          >
            {o.texto}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="min-h-16">
        {marcada !== null && (
          <div className="mt-4 flex items-start gap-4">
            {acertou && <span className="carimbo shrink-0">Certo</span>}
            <p className={clsx("text-[0.98rem]", !acertou && "text-grafite")}>{item.opcoes[marcada]!.retorno}</p>
          </div>
        )}
      </div>
    </div>
  );
}

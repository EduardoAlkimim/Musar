"use client";

import { useState } from "react";

/** Botão que vira carimbo depois de confirmado. Usado para aprovar, registrar e agendar. */
export function Confirmar({
  rotulo,
  carimbo,
  depois,
  variante = "tinta",
}: {
  rotulo: string;
  carimbo: string;
  depois?: string;
  variante?: "tinta" | "linha";
}) {
  const [feito, setFeito] = useState(false);
  if (feito) {
    return (
      <span className="inline-flex items-center gap-3" role="status">
        <span className="carimbo">{carimbo}</span>
        {depois && <span className="text-sm text-grafite">{depois}</span>}
      </span>
    );
  }
  return (
    <button type="button" className={variante === "tinta" ? "botao-tinta" : "botao-linha"} onClick={() => setFeito(true)}>
      {rotulo}
    </button>
  );
}

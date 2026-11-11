import { MARCA } from "@/lib/marca";

/**
 * Símbolo: uma trilha a lápis, tracejada, que sai de um ponto vazado (onde o aluno está)
 * e chega a um ponto cheio em verde-escola (a habilidade dominada).
 */
export function Simbolo({ tamanho = 28, className }: { tamanho?: number; className?: string }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path
        d="M5 26.5c6.5 0 5.5-10 11-10s4.5-10 11-10"
        stroke="var(--color-tinta)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="0.1 4.4"
      />
      <circle cx="5" cy="26.5" r="2.6" stroke="var(--color-tinta)" strokeWidth="1.6" fill="var(--color-papel)" />
      <circle cx="27" cy="6.5" r="3.6" fill="var(--color-escola)" />
    </svg>
  );
}

export function Marca({ grande = false }: { grande?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Simbolo tamanho={grande ? 92 : 26} className={grande ? "-mr-1 translate-y-1" : undefined} />
      <span className={grande ? "font-serif text-[4.5rem] italic leading-[0.9] sm:text-[6.5rem]" : "font-serif text-[1.6rem] italic leading-none tracking-tight"}>
        {MARCA}
      </span>
    </span>
  );
}

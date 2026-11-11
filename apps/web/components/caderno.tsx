import clsx from "clsx";
import type { AlertReason } from "@escola/domain";

/** Frase-decisão: abre toda tela. Uma frase, um número, uma ação. */
export function Decisao({
  sobre,
  frase,
  detalhe,
  children,
}: {
  sobre: string;
  frase: React.ReactNode;
  detalhe?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="entra margem pl-6 sm:pl-8" aria-labelledby="decisao">
      <p className="rotulo mb-3">{sobre}</p>
      <h1 id="decisao" className="max-w-[22ch] text-[2.4rem] sm:text-[3.4rem]">
        {frase}
      </h1>
      {detalhe && <p className="mt-4 max-w-[56ch] text-[1.05rem] text-grafite">{detalhe}</p>}
      {children && <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div>}
    </section>
  );
}

export function Pagina({ children, className }: { children: React.ReactNode; className?: string }) {
  // Largura própria (ex.: max-w-[34rem] nas telas de celular) substitui a padrão, sem as duas competirem.
  const largura = className?.includes("max-w-") ? "" : "max-w-[76rem]";
  return <main className={clsx("mx-auto px-5 pb-24 pt-10 sm:px-8 sm:pt-14", largura, className)}>{children}</main>;
}

export function TituloSecao({ children, nota }: { children: React.ReactNode; nota?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-pauta pb-2">
      <h2 className="text-[1.45rem]">{children}</h2>
      {nota && <p className="text-sm text-grafite">{nota}</p>}
    </div>
  );
}

/** "Por que estou vendo isso": os dados que geraram o alerta, com o peso de cada um. */
export function PorQue({ motivos, score, pontos = true }: { motivos: AlertReason[]; score: number; pontos?: boolean }) {
  return (
    <details className="group mt-2 text-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-grafite hover:text-tinta [&::-webkit-details-marker]:hidden">
        <span className="link-sublinhado">Por que estou vendo isso</span>
        <span aria-hidden className="transition-transform group-open:rotate-90">›</span>
      </summary>
      <ul className="mt-3 space-y-1.5 border-l border-pauta-forte pl-4">
        {motivos.map((m) => (
          <li key={m.text} className="flex items-baseline justify-between gap-6">
            <span>{m.text}</span>
            {pontos && <span className="num shrink-0 font-mono text-xs text-grafite">+{m.points}</span>}
          </li>
        ))}
        {pontos && (
          <li className="flex items-baseline justify-between gap-6 border-t border-dashed border-pauta-forte pt-1.5 font-medium">
            <span>Pontuação de atenção (alerta a partir de 50)</span>
            <span className="num font-mono text-xs">{score}</span>
          </li>
        )}
      </ul>
    </details>
  );
}

export function CodigoBncc({ codigo }: { codigo: string }) {
  return <abbr title="Código da habilidade na BNCC" className="font-mono text-[0.78rem] tracking-wide text-grafite no-underline">{codigo}</abbr>;
}

/** Barra de domínio 0–100, como régua escolar. */
export function Regua({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="flex items-center gap-3" role="img" aria-label={`${rotulo}: ${valor} de 100`}>
      <div className="relative h-2 w-28 overflow-hidden rounded-[1px] bg-areia">
        <div className="absolute inset-y-0 left-0 bg-escola" style={{ width: `${valor}%` }} />
        {[25, 50, 75].map((t) => (
          <span key={t} className="absolute inset-y-0 w-px bg-papel/80" style={{ left: `${t}%` }} />
        ))}
      </div>
      <span className="num w-7 font-mono text-xs text-grafite">{valor}</span>
    </div>
  );
}

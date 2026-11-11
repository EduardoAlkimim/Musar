"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { MARCA, type AREAS } from "@/lib/marca";
import { Marca } from "@/components/marca";

type Area = (typeof AREAS)[number];

/** Cabeçalho: as áreas da pessoa como divisórias de fichário, escola e sair. */
export function Cabecalho({ areas, nome, escola, extras = [] }: { areas: Area[]; nome: string; escola: string; extras?: { href: string; rotulo: string; contador?: number }[] }) {
  const caminho = usePathname();
  const itens = [...areas.map((a) => ({ href: a.href, rotulo: a.rotulo, contador: undefined as number | undefined })), ...extras];
  const ativo = [...itens].sort((a, b) => b.href.length - a.href.length).find((p) => caminho.startsWith(p.href));

  return (
    <header className="sticky top-0 z-30 border-b border-pauta bg-papel/90 backdrop-blur-[2px]">
      <div className="mx-auto flex max-w-[76rem] items-end gap-6 px-5 pt-4 sm:px-8">
        <Link href="/" className="mb-3 flex items-center gap-3" aria-label={`${MARCA}, página inicial`}>
          <Marca />
          <span className="hidden font-mono text-[0.68rem] uppercase tracking-[0.14em] text-grafite md:inline">{escola}</span>
        </Link>

        <details className="group relative mb-2.5 ml-auto sm:hidden">
          <summary className="botao-linha min-h-10 cursor-pointer list-none text-sm [&::-webkit-details-marker]:hidden">
            {ativo?.rotulo ?? "Menu"} <span aria-hidden className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <ul className="folha absolute right-0 top-full z-40 mt-1 w-56 py-1">
            {itens.map((p) => (
              <li key={p.href}>
                <Link href={p.href} aria-current={ativo?.href === p.href ? "page" : undefined} className="block px-4 py-2.5 text-sm hover:bg-papel aria-[current=page]:font-semibold">
                  {p.rotulo} {p.contador ? `(${p.contador})` : ""}
                </Link>
              </li>
            ))}
            <li className="border-t border-pauta"><a href="/sair" className="block px-4 py-2.5 text-sm text-grafite hover:bg-papel">Sair</a></li>
          </ul>
        </details>

        <nav aria-label="Áreas" className="-mb-px ml-auto hidden gap-1 sm:flex">
          {itens.map((p) => {
            const atual = ativo?.href === p.href;
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={atual ? "page" : undefined}
                className={clsx(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-t-[3px] border px-3.5 py-2 text-sm transition-colors",
                  atual ? "border-pauta border-b-folha bg-folha font-semibold text-tinta" : "border-transparent text-grafite hover:text-tinta",
                )}
              >
                {p.rotulo}
                {!!p.contador && <span className="num rounded-full bg-escola px-1.5 font-mono text-[0.65rem] leading-4 text-folha">{p.contador}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="bg-folha">
        <div className="mx-auto flex max-w-[76rem] items-center justify-between px-5 py-1.5 text-[0.8rem] text-grafite sm:px-8">
          <p>
            <strong className="font-semibold text-tinta">{nome}</strong>
            <span className="md:hidden"> · {escola}</span>
          </p>
          <a href="/sair" className="link-sublinhado hidden sm:inline">Sair</a>
        </div>
      </div>
    </header>
  );
}

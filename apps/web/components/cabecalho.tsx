"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { MARCA, PERFIS } from "@/lib/marca";
import { Marca } from "@/components/marca";

/** Cabeçalho com a troca de perfil no topo, como divisórias de fichário. */
export function Cabecalho() {
  const caminho = usePathname();
  const ativo = PERFIS.find((p) => caminho.startsWith(p.href));

  return (
    <header className="border-b border-pauta bg-papel/90 backdrop-blur-[2px] sticky top-0 z-30">
      <div className="mx-auto flex max-w-[76rem] items-end gap-6 px-5 pt-4 sm:px-8">
        <Link href="/" className="mb-3 flex items-center gap-3" aria-label={`${MARCA}, página inicial`}>
          <Marca />
          <span className="hidden font-mono text-[0.68rem] uppercase tracking-[0.14em] text-grafite sm:inline">
            Escola de demonstração
          </span>
        </Link>

        <details className="group relative mb-2.5 ml-auto sm:hidden">
          <summary className="botao-linha min-h-10 cursor-pointer list-none text-sm [&::-webkit-details-marker]:hidden">
            {ativo?.rotulo ?? "Perfil"} <span aria-hidden className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <ul className="folha absolute right-0 top-full z-40 mt-1 w-52 py-1">
            {PERFIS.map((p) => (
              <li key={p.href}>
                <Link href={p.href} aria-current={ativo?.href === p.href ? "page" : undefined} className="block px-4 py-2.5 text-sm hover:bg-papel aria-[current=page]:font-semibold">
                  {p.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </details>

        <nav aria-label="Trocar de perfil" className="-mb-px ml-auto hidden gap-1 sm:flex">
          {PERFIS.map((p) => {
            const atual = ativo?.href === p.href;
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={atual ? "page" : undefined}
                className={clsx(
                  "whitespace-nowrap rounded-t-[3px] border px-3.5 py-2 text-sm transition-colors",
                  atual
                    ? "border-pauta border-b-folha bg-folha font-semibold text-tinta"
                    : "border-transparent text-grafite hover:text-tinta",
                )}
              >
                {p.rotulo}
              </Link>
            );
          })}
        </nav>
      </div>
      {ativo && (
        <div className="bg-folha">
          <p className="mx-auto max-w-[76rem] px-5 py-1.5 text-[0.8rem] text-grafite sm:px-8">
            Você está como <strong className="font-semibold text-tinta">{ativo.pessoa}</strong>
          </p>
        </div>
      )}
    </header>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GuiaDemo } from "@/components/guia-demo";
import { Shell, type Visao } from "@/components/shell";
import { passo as passoN, PASSOS } from "@/lib/demo";
import { visoesDe, type Papel } from "@/lib/marca";

export interface Pessoa { nome: string; escola: string; papeis: Papel[] }

/** Qual pessoa da escola de demonstração "está logada" em cada área. */
const DONO: [string, string][] = [
  ["/gestao", "ana"], ["/professor", "marta"], ["/mensagens", "marta"], ["/reforco", "renato"],
  ["/familia", "helena"], ["/aluno", "joao"], ["/admin", "admin"],
];
const donoDe = (caminho: string) => DONO.find(([p]) => caminho === p || caminho.startsWith(`${p}/`))?.[1] ?? "ana";

function Guia() {
  const busca = useSearchParams();
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const daUrl = Number(busca.get("passo"));
    if (daUrl) {
      sessionStorage.setItem("musar_demo_passo", String(daUrl));
      setN(daUrl);
    } else setN(Number(sessionStorage.getItem("musar_demo_passo")) || null);
  }, [busca]);
  const p = n ? passoN(n) : undefined;
  return p ? <GuiaDemo passo={p} total={PASSOS.length} estatico /> : null;
}

export function ShellEstatico({ pessoas, children }: { pessoas: Record<string, Pessoa>; children: React.ReactNode }) {
  const caminho = usePathname();
  const quem = donoDe(caminho);
  const p = pessoas[quem]!;
  // Cada pessoa vê só as áreas que a demonstração tem para ela.
  const visoes: Visao[] = visoesDe(p.papeis)
    .map((v) => ({ ...v, itens: v.itens.filter((i) => donoDe(i.href) === quem) }))
    .filter((v) => v.itens.length > 0);
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <>
      <Shell nome={p.nome} escola={p.escola} visoes={visoes} sairHref={`${base}/demo/`}>
        <p className="border-b border-[#f0dcaa] bg-ouro-claro px-4 py-2 text-center text-xs text-[#8a6417] sm:px-8">
          Demonstração do MUSAR · escola e pessoas fictícias · as ações são simuladas e nada é gravado
        </p>
        <div className="pb-44">{children}</div>
      </Shell>
      <Suspense fallback={null}><Guia /></Suspense>
    </>
  );
}

import Image from "next/image";
import { MARCA, SLOGAN } from "@/lib/marca";

/** Marca MUSAR: a arara e o nome. "clara" = sobre o azul-marinho da barra lateral. */
export function Marca({ variante = "escura", tamanho = "normal" }: { variante?: "clara" | "escura"; tamanho?: "normal" | "grande" }) {
  const grande = tamanho === "grande";
  return (
    <span className={grande ? "flex flex-col items-center gap-3 text-center" : "flex items-center gap-2.5"}>
      <Image src="/arara.png" alt="" width={grande ? 110 : 34} height={grande ? 130 : 40} priority className="h-auto" />
      <span>
        <span className={`block font-titulo font-bold tracking-[0.14em] ${grande ? "text-[2.1rem]" : "text-[1.15rem]"} ${variante === "clara" ? "text-ouro" : "text-marinho"}`}>{MARCA}</span>
        <span className={`block ${grande ? "text-sm" : "text-[0.62rem] uppercase tracking-[0.12em]"} ${variante === "clara" ? "text-white/60" : "text-suave"}`}>{SLOGAN}</span>
      </span>
    </span>
  );
}

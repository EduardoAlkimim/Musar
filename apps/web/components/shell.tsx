"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  AlertTriangle, BarChart3, BookOpen, CalendarCheck, FileCheck2, GraduationCap, HeartHandshake,
  LayoutDashboard, LifeBuoy, LogOut, Menu, MessageSquare, Upload, Users, X,
} from "lucide-react";
import { Marca } from "@/components/marca";
import { iniciais } from "@/lib/formato";
import { NOME_PAPEL, type ItemMenu, type Papel } from "@/lib/marca";

const ICONES: Record<ItemMenu["icone"], typeof LayoutDashboard> = {
  visao: LayoutDashboard, alerta: AlertTriangle, turmas: BookOpen, equipe: Users, reforco: LifeBuoy, relatorio: BarChart3,
  cadastro: Upload, provas: FileCheck2, mensagens: MessageSquare, agenda: CalendarCheck, familia: HeartHandshake, aluno: GraduationCap,
};

export interface Visao { papel: Papel; itens: ItemMenu[] }

/** Estrutura do MUSAR: barra lateral azul-marinho com o menu da visão e barra do topo com o título. */
export function Shell({ nome, escola, visoes, children }: { nome: string; escola: string; visoes: Visao[]; children: React.ReactNode }) {
  const caminho = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  // Item ativo = o de caminho mais longo que casa com a URL; a visão é a que contém esse item.
  const todos = visoes.flatMap((v) => v.itens);
  const ativo = [...todos].sort((a, b) => b.href.length - a.href.length).find((i) => caminho === i.href || caminho.startsWith(`${i.href}/`));
  const visao = visoes.find((v) => ativo && v.itens.includes(ativo)) ?? visoes[0]!;

  const lateral = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 pb-5 pt-6">
        <Link href="/" aria-label="MUSAR, início"><Marca variante="clara" /></Link>
      </div>

      {visoes.length > 1 ? (
        <label className="mx-4 mt-4 block">
          <span className="sr-only">Trocar de visão</span>
          <select
            value={visao.papel}
            onChange={(e) => router.push(visoes.find((v) => v.papel === e.target.value)!.itens[0]!.href)}
            className="h-10 w-full rounded-[10px] border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white outline-none focus:border-ouro"
          >
            {visoes.map((v) => <option key={v.papel} value={v.papel} className="text-marinho">{NOME_PAPEL[v.papel]}</option>)}
          </select>
        </label>
      ) : (
        <p className="mx-4 mt-4 rounded-[10px] border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white">{NOME_PAPEL[visao.papel]}</p>
      )}

      <p className="mt-6 px-5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/40">Menu</p>
      <nav aria-label="Menu" className="mt-2 flex-1">
        <ul>
          {visao.itens.map((i) => {
            const Icone = ICONES[i.icone];
            const atual = ativo?.href === i.href;
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  onClick={() => setAberto(false)}
                  aria-current={atual ? "page" : undefined}
                  className={clsx(
                    "flex items-center gap-3 border-l-[3px] px-5 py-2.5 text-[0.9rem] transition-colors",
                    atual ? "border-ouro bg-white/[0.07] font-semibold text-ouro" : "border-transparent text-white/75 hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  <Icone className="size-[18px]" />
                  {i.rotulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="truncate text-xs text-white/50">{escola}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ouro font-titulo text-xs font-bold text-marinho">{iniciais(nome)}</span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{nome}</span>
          <a href="/sair" className="rounded-md p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Sair" title="Sair"><LogOut className="size-4" /></a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:pl-[248px]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] bg-marinho lg:block">{lateral}</aside>

      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-marinho/40" onClick={() => setAberto(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] bg-marinho shadow-2xl">
            <button type="button" onClick={() => setAberto(false)} className="absolute right-3 top-3 rounded-md p-2 text-white/70 hover:bg-white/10" aria-label="Fechar menu"><X className="size-5" /></button>
            {lateral}
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-borda bg-white/90 px-4 backdrop-blur sm:px-8">
        <button type="button" onClick={() => setAberto(true)} className="-ml-1 rounded-md p-2 text-marinho hover:bg-azul-fundo lg:hidden" aria-label="Abrir menu"><Menu className="size-5" /></button>
        <h1 className="truncate font-titulo text-[1.05rem] font-semibold text-marinho">{ativo?.rotulo ?? "MUSAR"}</h1>
        <span className="badge badge-ouro hidden sm:inline-flex">{NOME_PAPEL[visao.papel]}</span>
        <span className="flex-1" />
        {todos.some((i) => i.href === "/mensagens") && (
          <Link href="/mensagens" className="grid size-9 place-items-center rounded-[10px] border border-borda bg-ouro-claro text-[#a8781f] hover:border-ouro" aria-label="Mensagens"><MessageSquare className="size-4" /></Link>
        )}
        <span className="grid size-9 place-items-center rounded-full bg-marinho font-titulo text-xs font-bold text-white" title={nome}>{iniciais(nome)}</span>
      </header>

      <main>{children}</main>
    </div>
  );
}


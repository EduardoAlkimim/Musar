import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, BookOpen, CalendarCheck, Users } from "lucide-react";
import { Pagina, Titulo } from "@/components/ui";
import { api } from "@/lib/api";
import { decimal } from "@/lib/formato";

export const metadata: Metadata = { title: "Turmas" };

interface Turma { id: string; nome: string; serie: string; turno: string; alunos: number; media: number | null; frequencia: number | null; comAlerta: number; professores: { materia: string; nome?: string }[] }
const TURNO: Record<string, string> = { MANHA: "Manhã", TARDE: "Tarde", NOITE: "Noite", INTEGRAL: "Integral" };

export default async function Turmas() {
  const ts = await api<Turma[]>("/gestao/turmas");
  return (
    <Pagina>
      <Titulo titulo="Turmas" subtitulo={`${ts.length} turmas · ${ts.reduce((s, t) => s + t.alunos, 0)} alunos`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ts.map((t) => (
          <Link key={t.id} href={`/gestao/turmas/${t.id}`} className="card entra block p-5 transition-shadow hover:shadow-[0_14px_30px_-20px_rgba(20,49,80,.5)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[1.15rem] font-semibold">{t.nome}</h2>
                <p className="text-sm text-suave">{t.serie} · {TURNO[t.turno] ?? t.turno}</p>
              </div>
              <span className="grid size-10 place-items-center rounded-[10px] bg-azul-fundo text-azul"><BookOpen className="size-5" /></span>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-[10px] bg-[#f7fafc] py-2.5"><dt className="rotulo">Média</dt><dd className={`num mt-0.5 font-titulo text-lg font-semibold ${t.media !== null && t.media < 6 ? "text-perigo" : "text-marinho"}`}>{decimal(t.media)}</dd></div>
              <div className="rounded-[10px] bg-[#f7fafc] py-2.5"><dt className="rotulo">Frequência</dt><dd className="num mt-0.5 font-titulo text-lg font-semibold">{t.frequencia ?? "—"}%</dd></div>
              <div className="rounded-[10px] bg-[#f7fafc] py-2.5"><dt className="rotulo">Alerta</dt><dd className={`num mt-0.5 font-titulo text-lg font-semibold ${t.comAlerta ? "text-perigo" : "text-sucesso"}`}>{t.comAlerta}</dd></div>
            </dl>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-suave">
              <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {t.alunos} alunos</span>
              <span className="inline-flex items-center gap-1"><CalendarCheck className="size-3.5" /> {t.professores.length} matérias</span>
              {t.comAlerta > 0 && <span className="inline-flex items-center gap-1 text-perigo"><AlertTriangle className="size-3.5" /> {t.comAlerta} com alerta</span>}
            </p>
          </Link>
        ))}
      </div>
    </Pagina>
  );
}

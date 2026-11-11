import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import type { AlertReason } from "@escola/domain";

export function Pagina({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("space-y-6 px-4 py-6 sm:px-8 sm:py-8", className?.includes("max-w-") && "mx-auto", className)}>{children}</div>;
}

export function Titulo({ titulo, subtitulo, children }: { titulo: React.ReactNode; subtitulo?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="entra flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.6rem] font-semibold sm:text-[1.85rem]">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-suave">{subtitulo}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({
  titulo,
  acao,
  children,
  className,
  icone: Icone,
  semPadding,
  ...resto
}: { titulo?: React.ReactNode; acao?: React.ReactNode; children: React.ReactNode; className?: string; icone?: LucideIcon; semPadding?: boolean } & Omit<React.HTMLAttributes<HTMLElement>, "title">) {
  return (
    <section className={clsx("card overflow-hidden", className)} {...resto}>
      {(titulo || acao) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4">
          {titulo && (
            <h2 className="flex items-center gap-2 text-[1rem] font-semibold">
              {Icone && <Icone className="size-4 text-ouro" />}
              {titulo}
            </h2>
          )}
          {acao && <div className="text-sm">{acao}</div>}
        </header>
      )}
      <div className={semPadding ? "pt-2" : "p-5"}>{children}</div>
    </section>
  );
}

const TONS = {
  azul: "bg-azul-fundo text-azul",
  perigo: "bg-perigo-claro text-perigo",
  sucesso: "bg-sucesso-claro text-sucesso",
  ouro: "bg-ouro-claro text-[#a8781f]",
} as const;

export function Indicador({
  icone: Icone,
  rotulo,
  valor,
  detalhe,
  tom = "azul",
  tendencia,
}: { icone: LucideIcon; rotulo: string; valor: React.ReactNode; detalhe?: React.ReactNode; tom?: keyof typeof TONS; tendencia?: "sobe" | "desce" | "neutra" }) {
  return (
    <div className="card entra p-5">
      <span className={clsx("grid size-9 place-items-center rounded-[10px]", TONS[tom])}>
        <Icone className="size-[18px]" />
      </span>
      <p className="rotulo mt-4">{rotulo}</p>
      <p className={clsx("num mt-1 font-titulo text-[2rem] font-semibold leading-none", tom === "perigo" ? "text-perigo" : tom === "sucesso" ? "text-sucesso" : "text-marinho")}>{valor}</p>
      {detalhe && (
        <p className={clsx("mt-2 text-xs", tendencia === "sobe" ? "text-sucesso" : tendencia === "desce" ? "text-perigo" : "text-suave")}>
          {tendencia === "sobe" ? "▲ " : tendencia === "desce" ? "▼ " : ""}
          {detalhe}
        </p>
      )}
    </div>
  );
}

export function Aviso({ tom = "perigo", children }: { tom?: "perigo" | "atencao" | "info"; children: React.ReactNode }) {
  const cores = { perigo: "border-[#fecaca] bg-perigo-claro", atencao: "border-[#fde68a] bg-atencao-claro", info: "border-[#c9dfeb] bg-azul-fundo" }[tom];
  const ponto = { perigo: "bg-perigo", atencao: "bg-atencao", info: "bg-azul" }[tom];
  return (
    <div role={tom === "perigo" ? "alert" : "status"} className={clsx("entra flex items-center gap-3 rounded-[12px] border px-4 py-3 text-sm", cores)}>
      <span className={clsx("size-2 shrink-0 rounded-full", ponto)} />
      <span>{children}</span>
    </div>
  );
}

/** Nível de atenção do alerta, no padrão do MUSAR: alto, médio, baixo. */
export function Nivel({ nivel, score }: { nivel: string; score?: number }) {
  const t = nivel === "alto" ? ["badge-perigo", "Alto"] : nivel === "medio" ? ["badge-atencao", "Médio"] : ["badge-sucesso", "Baixo"];
  return (
    <span className={clsx("badge", t[0])}>
      {t[1]}
      {score !== undefined && <span className="num font-normal opacity-80">({score})</span>}
    </span>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[12px] border border-dashed border-borda bg-white/60 px-4 py-8 text-center text-sm text-suave">{children}</p>;
}

export function Barra({ valor, max = 100, tom }: { valor: number; max?: number; tom?: "perigo" | "atencao" | "sucesso" | "azul" }) {
  const p = Math.max(0, Math.min(100, (valor / max) * 100));
  const cor = { perigo: "bg-perigo", atencao: "bg-atencao", sucesso: "bg-sucesso", azul: "bg-azul" }[tom ?? (p >= 60 ? "perigo" : p >= 35 ? "atencao" : "sucesso")];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#eef2f5]">
      <div className={clsx("h-full rounded-full", cor)} style={{ width: `${p}%` }} />
    </div>
  );
}

/** Domínio de 0 a 100 numa barra curta, com o número ao lado. */
export function Dominio({ valor }: { valor: number }) {
  return (
    <span className="inline-flex items-center gap-2" role="img" aria-label={`Domínio ${valor} de 100`}>
      <span className="w-20"><Barra valor={valor} tom={valor >= 70 ? "sucesso" : valor >= 50 ? "atencao" : "perigo"} /></span>
      <span className="num w-6 text-xs text-suave">{valor}</span>
    </span>
  );
}

/** "Por que estou vendo isso": os dados que geraram o alerta. */
export function PorQue({ motivos, score, pontos = true }: { motivos: AlertReason[]; score: number; pontos?: boolean }) {
  return (
    <details className="group text-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-azul hover:underline [&::-webkit-details-marker]:hidden">
        Por que estou vendo isso <span aria-hidden className="transition-transform group-open:rotate-90">›</span>
      </summary>
      <ul className="mt-2 space-y-1 rounded-[10px] bg-[#f7fafc] p-3">
        {motivos.map((m) => (
          <li key={m.text} className="flex items-baseline justify-between gap-6">
            <span>{m.text}</span>
            {pontos && <span className="num shrink-0 text-xs text-suave">+{m.points}</span>}
          </li>
        ))}
        {pontos && (
          <li className="flex justify-between gap-6 border-t border-borda pt-1 font-semibold">
            <span>Pontuação de risco (alerta a partir de 50)</span>
            <span className="num text-xs">{score}</span>
          </li>
        )}
      </ul>
    </details>
  );
}

/** Gráfico de linhas em SVG (média mensal por turma). */
export function GraficoLinhas({ rotulos, series }: { rotulos: string[]; series: { nome: string; valores: (number | null)[]; cor: string; destaque?: boolean }[] }) {
  const L = 600, A = 200, m = { e: 30, d: 14, t: 12, b: 26 };
  const todos = series.flatMap((s) => s.valores.filter((v): v is number => v !== null));
  const min = Math.max(0, Math.floor(Math.min(...todos, 6) - 1));
  const max = Math.min(10, Math.ceil(Math.max(...todos, 7) + 0.5));
  const x = (i: number) => m.e + (rotulos.length <= 1 ? (L - m.e - m.d) / 2 : (i * (L - m.e - m.d)) / (rotulos.length - 1));
  const y = (v: number) => m.t + ((max - v) * (A - m.t - m.b)) / (max - min || 1);
  const linhas = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div>
      <svg viewBox={`0 0 ${L} ${A}`} className="w-full" role="img" aria-label={`Média por mês: ${series.map((s) => `${s.nome} ${s.valores.map((v) => v ?? "sem dado").join(", ")}`).join("; ")}`}>
        {linhas.map((v) => (
          <g key={v}>
            <line x1={m.e} x2={L - m.d} y1={y(v)} y2={y(v)} stroke="#eef2f5" />
            <text x={m.e - 8} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#5f6f80">{v}</text>
          </g>
        ))}
        <line x1={m.e} x2={L - m.d} y1={y(6)} y2={y(6)} stroke="#dc2626" strokeOpacity="0.35" strokeDasharray="4 4" />
        {rotulos.map((r, i) => (
          <text key={r + i} x={x(i)} y={A - 6} textAnchor="middle" fontSize="10" fill="#5f6f80" style={{ textTransform: "capitalize" }}>{r}</text>
        ))}
        {[...series].sort((a, b) => Number(a.destaque ?? false) - Number(b.destaque ?? false)).map((s) => {
          const pts = s.valores.map((v, i) => (v === null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(" ");
          return (
            <g key={s.nome}>
              <polyline points={pts} fill="none" stroke={s.cor} strokeWidth={s.destaque ? 3 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
              {s.valores.map((v, i) => v !== null && <circle key={i} cx={x(i)} cy={y(v)} r={s.destaque ? 4 : 2.5} fill={s.cor} />)}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-suave">
        {series.map((s) => (
          <span key={s.nome} className={clsx("inline-flex items-center gap-1.5", s.destaque && "font-semibold text-marinho")}>
            <span className="inline-block h-1 w-4 rounded" style={{ background: s.cor }} />
            {s.nome}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-dashed border-perigo/40" /> média 6,0</span>
      </div>
    </div>
  );
}

export const CORES_TURMAS = ["#539fbb", "#2d6b8d", "#8fb3c9", "#6b7f99", "#a7bccb"];

/** Cabeçalho da tela: contexto, frase principal, detalhe e ações. */
export function Decisao({ sobre, frase, detalhe, children }: { sobre: string; frase: React.ReactNode; detalhe?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="card entra relative overflow-hidden p-6 sm:p-7" aria-labelledby="decisao">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-ouro" />
      <p className="rotulo">{sobre}</p>
      <h1 id="decisao" className="mt-2 max-w-[34ch] text-[1.6rem] font-semibold sm:text-[1.9rem]">{frase}</h1>
      {detalhe && <p className="mt-2 max-w-[70ch] text-suave">{detalhe}</p>}
      {children && <div className="mt-5 flex flex-wrap items-center gap-2">{children}</div>}
    </section>
  );
}

export function TituloSecao({ children, nota }: { children: React.ReactNode; nota?: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
      <h2 className="text-[1.1rem] font-semibold">{children}</h2>
      {nota && <p className="text-sm text-suave">{nota}</p>}
    </div>
  );
}

export const Regua = ({ valor }: { valor: number; rotulo?: string }) => <Dominio valor={valor} />;

export function CodigoBncc({ codigo }: { codigo: string }) {
  return <abbr title="Código da habilidade na BNCC" className="font-mono text-[0.75rem] text-suave no-underline">{codigo}</abbr>;
}

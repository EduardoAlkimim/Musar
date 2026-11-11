import clsx from "clsx";
import { masteryBand } from "@escola/domain";

/**
 * Mapa de calor alunos × habilidades.
 * Semáforo do MUSAR: verde para consolidada, âmbar para em progresso, vermelho para "precisa de apoio".
 */
export function MapaDeCalor({
  alunos,
  habilidades,
  dominio,
  destaque,
}: {
  alunos: { id: string; nome: string }[];
  habilidades: { id: string; codigo: string; nome: string }[];
  dominio: Record<string, Record<string, number>>;
  destaque: Set<string>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] table-fixed border-collapse text-sm">
        <caption className="sr-only">Domínio de cada aluno em cada habilidade, de 0 a 100</caption>
        <colgroup>
          <col className="w-[13rem]" />
          {habilidades.map((h) => <col key={h.id} />)}
        </colgroup>
        <thead>
          <tr className="border-b border-borda">
            <th scope="col" className="sticky left-0 bg-white px-4 py-3 text-left font-normal">
              <span className="rotulo">Aluno</span>
            </th>
            {habilidades.map((h) => (
              <th key={h.id} scope="col" className="px-1 py-3 text-center font-normal">
                <span className="block text-[0.82rem] font-semibold leading-tight">{h.nome}</span>
                <span className="block font-mono text-[0.66rem] text-suave">{h.codigo}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alunos.map((a) => (
            <tr key={a.id} className="border-b border-borda/70 last:border-0">
              <th scope="row" className="sticky left-0 bg-white px-4 py-1.5 text-left font-normal whitespace-nowrap">
                <span className={clsx(destaque.has(a.id) && "font-semibold text-perigo")}>{a.nome}{destaque.has(a.id) && " •"}</span>
              </th>
              {habilidades.map((h) => {
                const v = dominio[a.id]?.[h.id];
                const faixa = masteryBand(v);
                return (
                  <td key={h.id} className="p-[3px]">
                    <span
                      className={clsx(
                        "num flex h-8 items-center justify-center rounded-[6px] font-mono text-[0.78rem]",
                        faixa === "consolidada" && "bg-sucesso-claro text-[#15803d]",
                        faixa === "em-progresso" && "bg-atencao-claro text-[#b45309]",
                        faixa === "precisa-de-apoio" && "bg-perigo-claro font-semibold text-[#b91c1c]",
                      )}
                      title={`${a.nome} · ${h.nome}: ${v ?? "sem dados"}`}
                    >
                      {v ?? "–"}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-5 border-t border-borda px-4 py-3 text-xs text-suave">
        <Legenda className="bg-sucesso-claro ring-1 ring-[#bbf7d0]">consolidada (70+)</Legenda>
        <Legenda className="bg-atencao-claro ring-1 ring-[#fde68a]">em progresso (50–69)</Legenda>
        <Legenda className="bg-perigo-claro ring-1 ring-[#fecaca]">precisa de apoio (abaixo de 50)</Legenda>
        <span className="ml-auto"><span className="font-semibold text-perigo">Nome em vermelho</span> = alerta aberto</span>
      </div>
    </div>
  );
}

function Legenda({ className, style, children }: { className: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={clsx("inline-block size-3.5 rounded-[6px]", className)} style={style} />
      {children}
    </span>
  );
}

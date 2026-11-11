import clsx from "clsx";
import { masteryBand, type Skill } from "@escola/domain";

/**
 * Mapa de calor alunos × habilidades.
 * Sem semáforo: verde-escola para consolidada, areia para em progresso, hachura para "precisa de apoio".
 */
export function MapaDeCalor({
  alunos,
  habilidades,
  dominio,
  destaque,
}: {
  alunos: { id: string; nome: string }[];
  habilidades: Skill[];
  dominio: Record<string, Record<string, number>>;
  destaque: Set<string>;
}) {
  return (
    <div className="folha overflow-x-auto">
      <table className="w-full min-w-[44rem] table-fixed border-collapse text-sm">
        <caption className="sr-only">Domínio de cada aluno em cada habilidade, de 0 a 100</caption>
        <colgroup>
          <col className="w-[13rem]" />
          {habilidades.map((h) => <col key={h.code} />)}
        </colgroup>
        <thead>
          <tr className="border-b border-pauta">
            <th scope="col" className="sticky left-0 bg-folha px-4 py-3 text-left font-normal">
              <span className="rotulo">Aluno</span>
            </th>
            {habilidades.map((h) => (
              <th key={h.code} scope="col" className="px-1 py-3 text-center font-normal">
                <span className="block text-[0.82rem] font-semibold leading-tight">{h.shortName}</span>
                <span className="block font-mono text-[0.66rem] text-grafite">{h.code}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alunos.map((a) => (
            <tr key={a.id} className="border-b border-pauta/70 last:border-0">
              <th scope="row" className="sticky left-0 bg-folha px-4 py-1.5 text-left font-normal whitespace-nowrap">
                <span className={clsx(destaque.has(a.id) && "marcado font-semibold")}>{a.nome}</span>
              </th>
              {habilidades.map((h) => {
                const v = dominio[a.id]?.[h.code];
                const faixa = masteryBand(v);
                return (
                  <td key={h.code} className="p-[3px]">
                    <span
                      className={clsx(
                        "num flex h-8 items-center justify-center rounded-[2px] font-mono text-[0.78rem]",
                        faixa === "consolidada" && "bg-escola-claro text-escola-escuro",
                        faixa === "em-progresso" && "bg-areia text-tinta",
                        faixa === "precisa-de-apoio" && "text-tinta ring-1 ring-inset ring-pauta-forte",
                      )}
                      style={
                        faixa === "precisa-de-apoio"
                          ? { backgroundImage: "repeating-linear-gradient(135deg, transparent 0 5px, rgba(33,31,28,.13) 5px 6px)" }
                          : undefined
                      }
                      title={`${a.nome} · ${h.shortName}: ${v ?? "sem dados"}`}
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
      <div className="flex flex-wrap items-center gap-5 border-t border-pauta px-4 py-3 text-xs text-grafite">
        <Legenda className="bg-escola-claro">consolidada (70+)</Legenda>
        <Legenda className="bg-areia">em progresso (50–69)</Legenda>
        <Legenda
          className="ring-1 ring-inset ring-pauta-forte"
          style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent 0 3px, rgba(33,31,28,.2) 3px 4px)" }}
        >
          precisa de apoio (abaixo de 50)
        </Legenda>
        <span className="ml-auto"><span className="marcado font-semibold text-tinta">Nome marcado</span> = alerta aberto</span>
      </div>
    </div>
  );
}

function Legenda({ className, style, children }: { className: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={clsx("inline-block size-3.5 rounded-[2px]", className)} style={style} />
      {children}
    </span>
  );
}

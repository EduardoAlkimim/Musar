const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function dataCurta(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  return `${dias[dt.getUTCDay()]}, ${d} ${meses[m! - 1]}`;
}

export const decimal = (n: number | null | undefined, casas = 1) => (n === null || n === undefined ? "—" : n.toFixed(casas).replace(".", ","));
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const letra = (i: number) => "ABCDE"[i] ?? "?";
export const iniciais = (nome: string) => nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

/** "há 12 min", "há 3 h", "ontem", "há 4 dias". */
export function haQuanto(iso: string | Date) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `há ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `há ${Math.round(s / 3600)} h`;
  const d = Math.round(s / 86400);
  return d === 1 ? "ontem" : `há ${d} dias`;
}

export const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

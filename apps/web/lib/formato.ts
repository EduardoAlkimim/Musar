const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function dataCurta(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  return `${dias[dt.getUTCDay()]}, ${d} ${meses[m! - 1]}`;
}

export const decimal = (n: number, casas = 1) => n.toFixed(casas).replace(".", ",");
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const letra = (i: number) => "ABCDE"[i] ?? "?";

import dados from "@/estatico/dados.json";
import { ShellEstatico, type Pessoa } from "@/components/shell-estatico";

/** Versão estática: o menu e o nome vêm da pessoa dona de cada área, sem login. */
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  const pessoas = Object.fromEntries(
    Object.entries(dados.me as Record<string, { nome: string; escola: { nome: string }; papeis: Pessoa["papeis"] }>).map(([k, m]) => [k, { nome: m.nome, escola: m.escola.nome, papeis: m.papeis }]),
  );
  return <ShellEstatico pessoas={pessoas}>{children}</ShellEstatico>;
}

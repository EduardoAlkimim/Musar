import { redirect } from "next/navigation";
import { Marca } from "@/components/marca";
import { api, ErroApi, tokenAtual } from "@/lib/api";
import { areasDe, type Me } from "@/lib/marca";

const CONTAS = [
  { conta: "marta@trilha.local", quem: "Marta Ribeiro", papel: "Professora de Matemática do 6º A e B" },
  { conta: "renato@trilha.local", quem: "Renato Siqueira", papel: "Professor de reforço" },
  { conta: "beatriz@trilha.local", quem: "Beatriz Lemos", papel: "Coordenação pedagógica" },
  { conta: "helena@trilha.local", quem: "Helena Gomes", papel: "Mãe do João, 6º B" },
  { conta: "joao@trilha.local", quem: "João Gomes", papel: "Aluno do 6º B" },
  { conta: "admin@trilha.local", quem: "Admin Escola", papel: "Secretaria: cadastros e planilhas" },
];

export default async function Inicio({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  if (await tokenAtual()) {
    let destino = "/professor"; // sem vínculo, o layout da área mostra a mensagem
    try {
      const me = await api<Me>("/me");
      destino = areasDe(me.papeis)[0]?.href ?? destino;
    } catch (e) {
      if (!(e instanceof ErroApi)) throw e;
    }
    redirect(destino);
  }

  const contas = process.env.MOSTRAR_CONTAS_DE_TESTE === "1";
  return (
    <main className="mx-auto grid min-h-dvh max-w-[76rem] grid-cols-1 gap-12 px-5 py-12 sm:px-8 lg:grid-cols-12 lg:py-20">
      <section className="entra lg:col-span-6">
        <h1><Marca grande /></h1>
        <p className="mt-8 max-w-[30ch] font-serif text-[1.65rem] leading-snug">
          Avisa <span className="marcado">antes</span> de o problema virar nota baixa.
        </p>
        <p className="mt-5 max-w-[46ch] text-grafite">
          Corrige a prova, encontra a habilidade que ficou para trás e encaminha o aluno para o reforço certo.
        </p>
        {erro && (
          <p role="alert" className="mt-6 border-l-2 border-alerta pl-3 text-sm">
            {erro === "login-expirado" ? "O login demorou demais. Tente de novo." : "Não foi possível entrar. Tente de novo."}
          </p>
        )}
        <a href="/entrar" className="botao-tinta mt-8">Entrar</a>
      </section>

      {contas && (
        <section aria-labelledby="contas" className="folha pauta self-start px-6 pb-6 pt-8 sm:px-10 lg:col-span-6">
          <h2 id="contas" className="font-serif text-[1.7rem] leading-[2rem]">Contas de teste</h2>
          <p className="text-sm text-grafite">Só nesta máquina. Senha de todas: <code className="font-mono text-tinta">trilha-local</code></p>
          <ul className="entra-lista mt-2">
            {CONTAS.map((c) => (
              <li key={c.conta}>
                <a href={`/entrar?conta=${encodeURIComponent(c.conta)}`} className="group grid grid-cols-[1fr_auto] items-baseline gap-x-3 py-[1rem] leading-[2rem]">
                  <span className="min-w-0">
                    <span className="block font-semibold group-hover:text-escola">{c.quem}</span>
                    <span className="block truncate font-serif text-[1.1rem] italic text-grafite">{c.papel}</span>
                  </span>
                  <span className="font-mono text-xs text-grafite">entrar →</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

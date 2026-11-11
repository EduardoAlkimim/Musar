import { redirect } from "next/navigation";
import { Mail, PlayCircle } from "lucide-react";
import { Marca } from "@/components/marca";
import { api, ErroApi, tokenAtual } from "@/lib/api";
import { inicioDe, type Me } from "@/lib/marca";

const CONTAS = [
  { conta: "ana@musar.local", quem: "Ana Moura", papel: "Direção" },
  { conta: "beatriz@musar.local", quem: "Beatriz Lemos", papel: "Coordenação" },
  { conta: "marta@musar.local", quem: "Marta Ribeiro", papel: "Professora de Matemática" },
  { conta: "renato@musar.local", quem: "Renato Siqueira", papel: "Professor de reforço" },
  { conta: "helena@musar.local", quem: "Helena Gomes", papel: "Mãe do João" },
  { conta: "joao@musar.local", quem: "João Gomes", papel: "Aluno do 6º B" },
  { conta: "admin@musar.local", quem: "Secretaria", papel: "Cadastros" },
];

export default async function Inicio({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  if (await tokenAtual()) {
    let destino = "/gestao"; // sem vínculo, o layout da área mostra a mensagem
    try {
      destino = inicioDe((await api<Me>("/me")).papeis);
    } catch (e) {
      if (!(e instanceof ErroApi)) throw e;
    }
    redirect(destino);
  }
  const demo = process.env.DEMO_MODE === "1";
  const contas = process.env.MOSTRAR_CONTAS_DE_TESTE === "1";

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-12">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-azul/10 blur-3xl" />
      <div className="relative w-full max-w-[25rem]">
        <Marca tamanho="grande" />
        <div className="card entra mt-8 p-7">
          <h1 className="text-center text-[1.5rem] font-semibold">Entrar</h1>
          <p className="mt-1 text-center text-sm text-suave">Acesse sua conta para continuar.</p>
          {erro && (
            <p role="alert" className="mt-4 rounded-[10px] border border-[#fecaca] bg-perigo-claro px-3 py-2 text-sm text-[#991b1b]">
              {erro === "login-expirado" ? "O login demorou demais. Tente de novo." : "Não foi possível entrar. Tente de novo."}
            </p>
          )}
          <a href="/entrar" className="btn btn-primario mt-6 h-12 w-full text-base">
            <Mail className="size-4" /> Entrar com e-mail e senha
          </a>
          {demo && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-suave">
                <span className="h-px flex-1 bg-borda" />ou<span className="h-px flex-1 bg-borda" />
              </div>
              <a href="/demo" className="btn btn-secundario h-12 w-full text-base">
                <PlayCircle className="size-4 text-ouro" /> Ver a demonstração guiada
              </a>
            </>
          )}
        </div>

        {contas && (
          <details className="card mt-4 px-5 py-4 text-sm">
            <summary className="cursor-pointer font-semibold text-marinho">Contas de teste desta máquina</summary>
            <p className="mt-2 text-suave">Senha de todas: <code className="font-mono text-marinho">musar-local</code></p>
            <ul className="mt-2 divide-y divide-borda">
              {CONTAS.map((c) => (
                <li key={c.conta}>
                  <a href={`/entrar?conta=${encodeURIComponent(c.conta)}`} className="flex items-baseline justify-between gap-3 py-2 hover:text-azul">
                    <span><span className="font-semibold">{c.quem}</span> <span className="text-suave">· {c.papel}</span></span>
                    <span className="text-xs text-suave">entrar →</span>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </main>
  );
}

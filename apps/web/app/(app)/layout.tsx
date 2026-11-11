import { cookies } from "next/headers";
import { GuiaDemo } from "@/components/guia-demo";
import { Shell } from "@/components/shell";
import { Pagina } from "@/components/ui";
import { api, ErroApi } from "@/lib/api";
import { COOKIE_DEMO, demoLigado, passo, PASSOS } from "@/lib/demo";
import { visoesDe, type Me } from "@/lib/marca";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  let me: Me;
  try {
    me = await api<Me>("/me");
  } catch (e) {
    if (e instanceof ErroApi && e.status === 403) {
      return (
        <Pagina className="mx-auto max-w-xl pt-24">
          <div className="card p-8">
            <h1 className="text-2xl font-semibold">Seu acesso ainda não foi liberado</h1>
            <p className="mt-3 text-suave">{e.corpo.erro}. Peça para a secretaria da escola cadastrar o seu e-mail.</p>
            <a href="/sair" className="btn btn-secundario mt-6">Sair</a>
          </div>
        </Pagina>
      );
    }
    throw e;
  }
  const passoDemo = demoLigado() ? passo(Number((await cookies()).get(COOKIE_DEMO)?.value)) : undefined;
  return (
    <>
      <Shell nome={me.nome} escola={me.escola.nome} visoes={visoesDe(me.papeis)}>
        <div className={passoDemo ? "pb-44" : undefined}>{children}</div>
      </Shell>
      {passoDemo && <GuiaDemo passo={passoDemo} total={PASSOS.length} />}
    </>
  );
}

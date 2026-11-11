import { Cabecalho } from "@/components/cabecalho";
import { Pagina } from "@/components/caderno";
import { api, ErroApi } from "@/lib/api";
import { areasDe, type Me } from "@/lib/marca";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  let me: Me;
  try {
    me = await api<Me>("/me");
  } catch (e) {
    if (e instanceof ErroApi && e.status === 403) {
      return (
        <Pagina>
          <h1 className="text-[2.4rem]">Seu acesso ainda não foi liberado.</h1>
          <p className="mt-4 max-w-[52ch] text-grafite">{e.corpo.erro}. Peça para a secretaria da escola cadastrar o seu e-mail.</p>
          <a href="/sair" className="botao-linha mt-6">Sair</a>
        </Pagina>
      );
    }
    throw e;
  }
  const extras = me.papeis.includes("PROFESSOR") || me.papeis.includes("RESPONSAVEL") ? [{ href: "/mensagens", rotulo: "Mensagens" }] : [];
  return (
    <>
      <Cabecalho areas={areasDe(me.papeis)} nome={me.nome} escola={me.escola.nome} extras={extras} />
      {children}
    </>
  );
}

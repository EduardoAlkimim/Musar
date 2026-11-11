import { NextResponse, type NextRequest } from "next/server";
import * as oidc from "openid-client";
import { abrir, COOKIE, configuracaoOidc, opcoesCookie, selar, tokensDe } from "@/lib/sessao";

/**
 * Renova o token do Keycloak um minuto antes de vencer, para a pessoa não cair no meio do trabalho.
 * Atualiza o cookie na própria requisição (as páginas já leem o novo) e na resposta.
 */
export async function proxy(req: NextRequest) {
  const sessao = await abrir(req.cookies.get(COOKIE)?.value);
  if (!sessao || sessao.exp - 60 > Date.now() / 1000) return NextResponse.next();
  try {
    const r = await oidc.refreshTokenGrant(await configuracaoOidc(), sessao.refresh);
    const valor = await selar(tokensDe(r));
    req.cookies.set(COOKIE, valor);
    const res = NextResponse.next({ request: req });
    res.cookies.set(COOKIE, valor, { ...opcoesCookie, maxAge: 12 * 3600 });
    return res;
  } catch {
    // Sessão do Keycloak acabou: limpa e deixa a página mandar para o login.
    req.cookies.delete(COOKIE);
    const res = NextResponse.next({ request: req });
    res.cookies.set(COOKIE, "", { ...opcoesCookie, maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/|entrar|auth/|sair|icon.svg|favicon.ico).*)"],
};

import { NextResponse, type NextRequest } from "next/server";
import * as oidc from "openid-client";
import { COOKIE, COOKIE_LOGIN, configuracaoOidc, ENV, opcoesCookie, selar, tokensDe } from "@/lib/sessao";

/** Volta do Keycloak: troca o código pelos tokens e grava a sessão cifrada. */
export async function GET(req: NextRequest) {
  const bruto = req.cookies.get(COOKIE_LOGIN)?.value;
  if (!bruto) return NextResponse.redirect(`${ENV.appUrl}/?erro=login-expirado`);
  const { verifier, state, destino } = JSON.parse(bruto) as { verifier: string; state: string; destino: string };
  try {
    const config = await configuracaoOidc();
    const atual = new URL(req.nextUrl.pathname + req.nextUrl.search, ENV.appUrl);
    const r = await oidc.authorizationCodeGrant(config, atual, { pkceCodeVerifier: verifier, expectedState: state });
    const res = NextResponse.redirect(`${ENV.appUrl}${destino}`);
    res.cookies.set(COOKIE, await selar(tokensDe(r)), { ...opcoesCookie, maxAge: 12 * 3600 });
    res.cookies.delete(COOKIE_LOGIN);
    return res;
  } catch {
    return NextResponse.redirect(`${ENV.appUrl}/?erro=login`);
  }
}

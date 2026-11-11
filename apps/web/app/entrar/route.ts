import { NextResponse, type NextRequest } from "next/server";
import * as oidc from "openid-client";
import { COOKIE_LOGIN, configuracaoOidc, ENV, opcoesCookie } from "@/lib/sessao";

/** Inicia o login no Keycloak (código de autorização + PKCE). */
export async function GET(req: NextRequest) {
  const config = await configuracaoOidc();
  const verifier = oidc.randomPKCECodeVerifier();
  const state = oidc.randomState();
  const destino = req.nextUrl.searchParams.get("para") ?? "/";
  const url = oidc.buildAuthorizationUrl(config, {
    redirect_uri: `${ENV.appUrl}/auth/callback`,
    scope: "openid email profile",
    code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
    code_challenge_method: "S256",
    state,
    ...(req.nextUrl.searchParams.get("conta") ? { login_hint: req.nextUrl.searchParams.get("conta")! } : {}),
  });
  const res = NextResponse.redirect(url);
  res.cookies.set(COOKIE_LOGIN, JSON.stringify({ verifier, state, destino: destino.startsWith("/") ? destino : "/" }), { ...opcoesCookie, maxAge: 600 });
  return res;
}

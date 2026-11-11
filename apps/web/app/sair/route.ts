import { NextResponse } from "next/server";
import { COOKIE, ENV, opcoesCookie } from "@/lib/sessao";

/** Encerra a sessão aqui e no Keycloak. */
export async function GET() {
  const fim = new URL(`${ENV.issuer}/protocol/openid-connect/logout`);
  fim.searchParams.set("client_id", ENV.clientId);
  fim.searchParams.set("post_logout_redirect_uri", `${ENV.appUrl}/`);
  const res = NextResponse.redirect(fim);
  res.cookies.set(COOKIE, "", { ...opcoesCookie, maxAge: 0 });
  return res;
}

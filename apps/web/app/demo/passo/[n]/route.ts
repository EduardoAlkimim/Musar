import { NextResponse, type NextRequest } from "next/server";
import * as oidc from "openid-client";
import { COOKIE_DEMO, demoLigado, passo } from "@/lib/demo";
import { COOKIE, configuracaoOidc, ENV, opcoesCookie, selar, tokensDe } from "@/lib/sessao";

/**
 * Vai para um passo da demonstração: entra como a pessoa do passo (sem digitar senha)
 * e abre a tela certa. Só com DEMO_MODE=1, porque usa as senhas das contas de teste.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ n: string }> }) {
  if (!demoLigado()) return new NextResponse("Modo demonstração desligado", { status: 404 });
  const p = passo(Number((await params).n));
  if (!p) return NextResponse.redirect(`${ENV.appUrl}/demo`);

  const config = await configuracaoOidc();
  const r = await oidc.genericGrantRequest(config, "password", {
    username: `${p.conta}@musar.local`,
    password: process.env.DEMO_SENHA ?? "musar-local",
    scope: "openid email profile",
  });
  const res = NextResponse.redirect(`${ENV.appUrl}${p.rota}`);
  res.cookies.set(COOKIE, await selar(tokensDe(r)), { ...opcoesCookie, maxAge: 12 * 3600 });
  res.cookies.set(COOKIE_DEMO, String(p.n), { ...opcoesCookie, httpOnly: false, maxAge: 12 * 3600 });
  return res;
}

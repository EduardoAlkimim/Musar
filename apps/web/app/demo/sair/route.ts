import { NextResponse } from "next/server";
import { COOKIE_DEMO } from "@/lib/demo";
import { COOKIE, ENV, opcoesCookie } from "@/lib/sessao";

/** Encerra a demonstração e volta para a página de abertura. */
export async function GET() {
  const res = NextResponse.redirect(`${ENV.appUrl}/demo`);
  res.cookies.set(COOKIE, "", { ...opcoesCookie, maxAge: 0 });
  res.cookies.set(COOKIE_DEMO, "", { ...opcoesCookie, maxAge: 0 });
  return res;
}

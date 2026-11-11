import { NextResponse } from "next/server";
import { COOKIE_DEMO, demoLigado } from "@/lib/demo";
import { COOKIE, ENV, opcoesCookie } from "@/lib/sessao";

/** Volta a escola de demonstração ao estado inicial (antes de cada apresentação). */
export async function POST() {
  if (!demoLigado()) return new NextResponse("Modo demonstração desligado", { status: 404 });
  const r = await fetch(`${ENV.apiUrl}/demo/reiniciar`, { method: "POST", cache: "no-store" });
  const res = NextResponse.redirect(`${ENV.appUrl}/demo?${r.ok ? "reiniciada=1" : "erro=1"}`, { status: 303 });
  res.cookies.set(COOKIE, "", { ...opcoesCookie, maxAge: 0 });
  res.cookies.set(COOKIE_DEMO, "", { ...opcoesCookie, maxAge: 0 });
  return res;
}

import "server-only";
import { EncryptJWT, jwtDecrypt } from "jose";
import * as oidc from "openid-client";

/**
 * Sessão: tokens do Keycloak num cookie httpOnly, cifrado (JWE A256GCM).
 * O navegador nunca vê o token em texto; só o servidor do Next fala com a API.
 */
export const COOKIE = "musar_sessao";
export const COOKIE_LOGIN = "musar_login";

export const ENV = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  apiUrl: process.env.API_URL ?? "http://localhost:4000/api",
  issuer: process.env.KEYCLOAK_ISSUER ?? "http://localhost:8080/realms/musar",
  clientId: process.env.KEYCLOAK_CLIENT_ID ?? "musar-web",
};

function segredo() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("Defina SESSION_SECRET (32+ caracteres) em apps/web/.env.local");
  return new Uint8Array(Buffer.from(s, "base64url")).slice(0, 32);
}

export interface Tokens {
  access: string;
  refresh: string;
  /** Expiração do access token, em segundos (epoch). */
  exp: number;
}

export async function selar(t: Tokens) {
  return new EncryptJWT({ access: t.access, refresh: t.refresh, exp_access: t.exp }).setProtectedHeader({ alg: "dir", enc: "A256GCM" }).setIssuedAt().setExpirationTime("12h").encrypt(segredo());
}

export async function abrir(valor: string | undefined): Promise<Tokens | null> {
  if (!valor) return null;
  try {
    const { payload } = await jwtDecrypt(valor, segredo());
    return { access: String(payload.access), refresh: String(payload.refresh), exp: Number(payload.exp_access) };
  } catch {
    return null;
  }
}

let config: Promise<oidc.Configuration> | null = null;
export function configuracaoOidc() {
  config ??= oidc.discovery(new URL(ENV.issuer), ENV.clientId, process.env.KEYCLOAK_CLIENT_SECRET, undefined, {
    execute: ENV.issuer.startsWith("http://") ? [oidc.allowInsecureRequests] : [],
  });
  return config;
}

export function tokensDe(r: oidc.TokenEndpointResponse): Tokens {
  return { access: r.access_token, refresh: r.refresh_token ?? "", exp: Math.floor(Date.now() / 1000) + (r.expires_in ?? 300) };
}

export const opcoesCookie = { httpOnly: true, sameSite: "lax" as const, secure: ENV.appUrl.startsWith("https://"), path: "/" };

import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { comEscola, criarPrisma, type Papel, type PrismaClient, type Tx } from "@escola/db";

export const CONFIG = {
  /** Conexão da API: papel escola_app, sujeito ao RLS. */
  dbUrl: process.env.DATABASE_URL_APP ?? "postgresql://escola_app:escola_app@localhost:5442/escola",
  /** Conexão do job diário (superusuário local; em produção, um papel de job dedicado). */
  dbUrlJob: process.env.DATABASE_URL ?? "postgresql://escola:escola@localhost:5442/escola",
  issuer: process.env.KEYCLOAK_ISSUER ?? "http://localhost:8080/realms/musar",
  clientId: process.env.KEYCLOAK_CLIENT_ID ?? "musar-web",
};

export const PRISMA = Symbol("Prisma");
export const prismaProvider = { provide: PRISMA, useFactory: (): PrismaClient => criarPrisma(CONFIG.dbUrl) };

export interface Sessao {
  userId: string;
  nome: string;
  email: string;
  schoolId: string;
  escola: { id: string; nome: string; slug: string };
  papeis: Papel[];
  escolas: { id: string; nome: string; slug: string; papeis: Papel[] }[];
}

const PUBLICO = "rota-publica";
const PAPEIS = "papeis-exigidos";
export const Publico = () => SetMetadata(PUBLICO, true);
/** Restringe a rota a quem tem pelo menos um destes papéis na escola ativa. */
export const Papeis = (...p: Papel[]) => SetMetadata(PAPEIS, p);
export const Usuario = createParamDecorator((_: unknown, ctx: ExecutionContext): Sessao => ctx.switchToHttp().getRequest().sessao);

const jwks = createRemoteJWKSet(new URL(`${CONFIG.issuer}/protocol/openid-connect/certs`));

/**
 * Autenticação de toda rota (exceto @Publico): token do Keycloak → usuário → vínculo.
 * A escola vem do vínculo (cabeçalho x-escola escolhe entre as do usuário), nunca de um id solto.
 */
@Injectable()
export class GuardaDeAcesso implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PRISMA) private readonly prisma: PrismaClient,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const alvo = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLICO, alvo)) return true;
    const req = ctx.switchToHttp().getRequest();

    const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? "")?.[1];
    if (!token) throw new UnauthorizedException({ erro: "Faça login para continuar" });
    let claims;
    try {
      claims = (await jwtVerify(token, jwks, { issuer: CONFIG.issuer })).payload;
    } catch {
      throw new UnauthorizedException({ erro: "Sessão expirada ou inválida" });
    }
    if (claims.azp !== CONFIG.clientId || typeof claims.sub !== "string") throw new UnauthorizedException({ erro: "Token de outro aplicativo" });

    // Identidade global: casa pelo id do Keycloak ou pelo e-mail verificado (primeiro login, ou conta
    // recriada no Keycloak). Só vale porque o realm não tem cadastro aberto: o e-mail é verificado por nós.
    let user = await this.prisma.user.findUnique({ where: { keycloakId: claims.sub } });
    if (!user && claims.email_verified === true && typeof claims.email === "string") {
      const porEmail = await this.prisma.user.findUnique({ where: { email: claims.email.toLowerCase() } });
      if (porEmail) user = await this.prisma.user.update({ where: { id: porEmail.id }, data: { keycloakId: claims.sub } });
    }
    if (!user) throw new ForbiddenException({ erro: "Seu e-mail ainda não foi cadastrado por uma escola" });

    const vinculos = await comEscola(this.prisma, { userId: user.id, schoolId: null }, (tx) =>
      tx.membership.findMany({ where: { userId: user.id, ativo: true }, include: { school: true }, orderBy: { school: { nome: "asc" } } }),
    );
    if (vinculos.length === 0) throw new ForbiddenException({ erro: "Você não tem vínculo ativo com nenhuma escola" });
    const pedida = req.headers["x-escola"];
    const ativo = (pedida ? vinculos.find((v) => v.school.slug === pedida || v.school.id === pedida) : vinculos[0]) ?? null;
    if (!ativo) throw new ForbiddenException({ erro: "Você não tem vínculo com essa escola" });

    const sessao: Sessao = {
      userId: user.id,
      nome: user.nome,
      email: user.email,
      schoolId: ativo.schoolId,
      escola: { id: ativo.school.id, nome: ativo.school.nome, slug: ativo.school.slug },
      papeis: ativo.papeis,
      escolas: vinculos.map((v) => ({ id: v.school.id, nome: v.school.nome, slug: v.school.slug, papeis: v.papeis })),
    };
    req.sessao = sessao;

    const exigidos = this.reflector.getAllAndOverride<Papel[]>(PAPEIS, alvo);
    if (exigidos?.length && !exigidos.some((p) => sessao.papeis.includes(p))) {
      throw new ForbiddenException({ erro: "Seu perfil não tem acesso a esta área" });
    }
    return true;
  }
}

/** Atalho: transação presa à escola e ao usuário da sessão (RLS no banco). */
export function naEscola<T>(prisma: PrismaClient, s: Sessao, fn: (tx: Tx) => Promise<T>) {
  return comEscola(prisma, { userId: s.userId, schoolId: s.schoolId }, fn);
}

/** Direção, coordenação e secretaria enxergam a escola inteira. */
export const ehGestao = (s: Sessao) => s.papeis.some((p) => p === "DIRETOR" || p === "COORDENADOR" || p === "ADMIN");

/** Registro LGPD: quem viu qual aluno e quando. */
export async function registrarAcesso(tx: Tx, s: Sessao, acao: string, studentIds: (string | null)[] = [null]) {
  await tx.accessLog.createMany({ data: studentIds.map((studentId) => ({ schoolId: s.schoolId, userId: s.userId, studentId, acao })) });
}

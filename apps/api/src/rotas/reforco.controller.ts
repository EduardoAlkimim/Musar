import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Inject, NotFoundException, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { z } from "zod";
import type { AlertReason, Tutor } from "@escola/domain";
import type { PrismaClient, Tx } from "@escola/db";
import { naEscola, Papeis, PRISMA, registrarAcesso, Usuario, type Sessao } from "../base";
import { mapaHabilidades, nomes, turmaDoAluno } from "../consultas";

const CorpoAceitar = z.object({ inicio: z.string().datetime({ offset: true }), modo: z.enum(["presencial", "online"]) });
const CorpoRegistro = z.object({ texto: z.string().trim().min(3).max(4000) });
const CorpoConcluir = z.object({ fechou: z.boolean() });

@Controller("reforco")
export class ReforcoController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  /** Fila do professor de reforço, com o diagnóstico pronto, e a agenda. */
  @Get("fila")
  @Papeis("PROFESSOR_REFORCO")
  fila(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, async (tx) => {
      const pedidos = await tx.tutoringRequest.findMany({
        where: { tutorId: s.userId, status: { in: ["AGUARDANDO_RESPONSAVEL", "APROVADO", "EM_ANDAMENTO"] } },
        include: { alerta: true, sessoes: { orderBy: { inicio: "asc" } } },
        orderBy: { createdAt: "asc" },
      });
      const gente = await nomes(tx, pedidos.flatMap((p) => [p.alerta.studentId, p.pedidoPor]));
      const skills = await mapaHabilidades(tx);
      const perfil = await tx.tutorProfile.findUnique({ where: { schoolId_userId: { schoolId: s.schoolId, userId: s.userId } } });
      await registrarAcesso(tx, s, "fila_reforco", pedidos.map((p) => p.alerta.studentId));

      const itens = [];
      for (const p of pedidos) {
        const turma = await turmaDoAluno(tx, p.alerta.studentId);
        const m = p.alerta.motivos as unknown as { reasons: AlertReason[]; mastery: number };
        const k = skills.get(p.alerta.skillId)!;
        itens.push({
          id: p.id,
          status: p.status,
          aluno: { id: p.alerta.studentId, nome: gente.get(p.alerta.studentId)?.nome ?? "", turma: turma?.turma.nome },
          habilidade: { codigo: k.codigo, nome: k.nomeCurto, descricao: k.descricao },
          dominio: m.mastery,
          motivos: m.reasons,
          score: p.alerta.score,
          plano: p.plano,
          pedidoPor: gente.get(p.pedidoPor)?.nome,
          pedidoEm: p.createdAt,
          sessoes: p.sessoes.map((x) => ({ id: x.id, inicio: x.inicio, modo: x.modo, registro: x.registro })),
        });
      }
      return { horarios: perfil?.horarios ?? [], itens };
    });
  }

  @Post("pedidos/:id/aceitar")
  @Papeis("PROFESSOR_REFORCO")
  aceitar(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string, @Body() corpo: unknown) {
    const p = CorpoAceitar.safeParse(corpo);
    if (!p.success) throw new BadRequestException({ erro: "Informe data, horário e modo da primeira sessão" });
    return naEscola(this.prisma, s, async (tx) => {
      const pedido = await this.doTutor(tx, s, id);
      if (pedido.status !== "APROVADO") throw new ConflictException({ erro: "O plano só começa depois da aprovação do responsável" });
      await tx.tutoringRequest.update({ where: { id }, data: { status: "EM_ANDAMENTO" } });
      const sessao = await tx.tutoringSession.create({ data: { schoolId: s.schoolId, requestId: id, inicio: new Date(p.data.inicio), modo: p.data.modo } });
      return { ok: true, sessao };
    });
  }

  @Post("sessoes/:id/registro")
  @Papeis("PROFESSOR_REFORCO")
  registrar(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string, @Body() corpo: unknown) {
    const p = CorpoRegistro.safeParse(corpo);
    if (!p.success) throw new BadRequestException({ erro: "Escreva o que foi feito na sessão" });
    return naEscola(this.prisma, s, async (tx) => {
      const sessao = await tx.tutoringSession.findUnique({ where: { id }, include: { pedido: true } });
      if (!sessao || sessao.pedido.tutorId !== s.userId) throw new NotFoundException({ erro: "Sessão não encontrada" });
      return tx.tutoringSession.update({ where: { id }, data: { registro: p.data.texto } });
    });
  }

  @Post("pedidos/:id/sessoes")
  @Papeis("PROFESSOR_REFORCO")
  agendar(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string, @Body() corpo: unknown) {
    const p = CorpoAceitar.safeParse(corpo);
    if (!p.success) throw new BadRequestException({ erro: "Informe data, horário e modo" });
    return naEscola(this.prisma, s, async (tx) => {
      const pedido = await this.doTutor(tx, s, id);
      if (pedido.status !== "EM_ANDAMENTO") throw new ConflictException({ erro: "Só dá para agendar reforço em andamento" });
      return tx.tutoringSession.create({ data: { schoolId: s.schoolId, requestId: id, inicio: new Date(p.data.inicio), modo: p.data.modo } });
    });
  }

  /** Fecha o reforço. "fechou" = o aluno dominou a habilidade na mini-avaliação de saída. */
  @Post("pedidos/:id/concluir")
  @Papeis("PROFESSOR_REFORCO")
  concluir(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string, @Body() corpo: unknown) {
    const p = CorpoConcluir.safeParse(corpo);
    if (!p.success) throw new BadRequestException({ erro: "Informe se o aluno fechou a habilidade" });
    return naEscola(this.prisma, s, async (tx) => {
      const pedido = await this.doTutor(tx, s, id);
      if (pedido.status !== "EM_ANDAMENTO") throw new ConflictException({ erro: "Só dá para concluir reforço em andamento" });
      const alerta = await tx.alert.findUniqueOrThrow({ where: { id: pedido.alertId } });
      const skill = await tx.skill.findUniqueOrThrow({ where: { id: alerta.skillId } });
      const perfil = await tx.tutorProfile.findUniqueOrThrow({ where: { schoolId_userId: { schoolId: s.schoolId, userId: s.userId } } });
      const hist = (perfil.historico ?? {}) as Tutor["history"];
      const h = hist[skill.codigo] ?? { closed: 0, total: 0 };
      hist[skill.codigo] = { closed: h.closed + (p.data.fechou ? 1 : 0), total: h.total + 1 };

      await tx.tutorProfile.update({ where: { id: perfil.id }, data: { historico: hist } });
      await tx.tutoringRequest.update({ where: { id }, data: { status: "CONCLUIDO" } });
      // Se não fechou, o alerta volta a ficar aberto para a professora decidir o próximo passo.
      await tx.alert.update({ where: { id: alerta.id }, data: { status: p.data.fechou ? "RESOLVIDO" : "ABERTO" } });
      return { ok: true };
    });
  }

  private async doTutor(tx: Tx, s: Sessao, id: string) {
    const pedido = await tx.tutoringRequest.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException({ erro: "Pedido de reforço não encontrado" });
    if (pedido.tutorId !== s.userId) throw new ForbiddenException({ erro: "Este aluno foi encaminhado a outro professor" });
    return pedido;
  }
}

import { BadRequestException, Body, Controller, ForbiddenException, Get, Inject, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { z } from "zod";
import type { PrismaClient, Tx } from "@escola/db";
import { naEscola, PRISMA, Usuario, type Sessao } from "../base";
import { nomes, turmaDoAluno } from "../consultas";

const CorpoMensagem = z.object({ alunoId: z.string().uuid(), paraId: z.string().uuid(), texto: z.string().trim().min(2).max(2000) });

/**
 * Família ↔ professor, sempre sobre um aluno. Só vale entre o responsável do aluno
 * e quem dá aula na turma dele (nos dois sentidos).
 */
async function podeConversar(tx: Tx, de: string, para: string, alunoId: string) {
  const turma = await turmaDoAluno(tx, alunoId);
  if (!turma) return false;
  const professores = new Set((await tx.classSubject.findMany({ where: { classId: turma.classId } })).map((c) => c.teacherId));
  const responsaveis = new Set((await tx.guardianLink.findMany({ where: { studentId: alunoId, consentimentoEm: { not: null } } })).map((g) => g.guardianId));
  return (responsaveis.has(de) && professores.has(para)) || (professores.has(de) && responsaveis.has(para));
}

@Controller("mensagens")
export class MensagensController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  @Get()
  listar(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, async (tx) => {
      const ms = await tx.message.findMany({ where: { OR: [{ toUserId: s.userId }, { fromUserId: s.userId }] }, orderBy: { createdAt: "desc" }, take: 100 });
      const gente = await nomes(tx, ms.flatMap((m) => [m.fromUserId, m.toUserId, m.studentId]));
      return ms.map((m) => ({
        id: m.id,
        de: { id: m.fromUserId, nome: gente.get(m.fromUserId)?.nome },
        para: { id: m.toUserId, nome: gente.get(m.toUserId)?.nome },
        aluno: { id: m.studentId, nome: gente.get(m.studentId)?.nome },
        texto: m.texto,
        recebida: m.toUserId === s.userId,
        lidaEm: m.lidaEm,
        em: m.createdAt,
      }));
    });
  }

  @Post()
  enviar(@Usuario() s: Sessao, @Body() corpo: unknown) {
    const p = CorpoMensagem.safeParse(corpo);
    if (!p.success) throw new BadRequestException({ erro: "Escreva a mensagem" });
    return naEscola(this.prisma, s, async (tx) => {
      if (!(await podeConversar(tx, s.userId, p.data.paraId, p.data.alunoId))) {
        throw new ForbiddenException({ erro: "Mensagens só entre o responsável e os professores da turma" });
      }
      // Responder conta como ter lido o que a outra pessoa mandou nesta conversa.
      await tx.message.updateMany({ where: { fromUserId: p.data.paraId, toUserId: s.userId, studentId: p.data.alunoId, lidaEm: null }, data: { lidaEm: new Date() } });
      return tx.message.create({ data: { schoolId: s.schoolId, fromUserId: s.userId, toUserId: p.data.paraId, studentId: p.data.alunoId, texto: p.data.texto } });
    });
  }

  @Post(":id/lida")
  marcarLida(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string) {
    return naEscola(this.prisma, s, async (tx) => {
      const r = await tx.message.updateMany({ where: { id, toUserId: s.userId, lidaEm: null }, data: { lidaEm: new Date() } });
      return { ok: r.count > 0 };
    });
  }
}

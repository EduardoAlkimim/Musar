import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Inject, NotFoundException, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { z } from "zod";
import type { AlertReason } from "@escola/domain";
import type { PrismaClient, Tx } from "@escola/db";
import { naEscola, Papeis, PRISMA, registrarAcesso, Usuario, type Sessao } from "../base";
import { frequencia, mapaHabilidades, nomes, relatorioDaProva, turmaDoAluno } from "../consultas";

export const VERSAO_TERMO = "v1.0";
const CorpoConsentimento = z.object({ alunoId: z.string().uuid(), versao: z.literal(VERSAO_TERMO) });

async function exigirFilho(tx: Tx, s: Sessao, alunoId: string, comConsentimento = true) {
  const vinculo = await tx.guardianLink.findUnique({ where: { guardianId_studentId: { guardianId: s.userId, studentId: alunoId } } });
  if (!vinculo) throw new ForbiddenException({ erro: "Você não é responsável por este aluno" });
  if (comConsentimento && !vinculo.consentimentoEm) throw new ForbiddenException({ erro: "Antes, aceite o termo de uso dos dados", precisaConsentimento: true });
  return vinculo;
}

@Controller()
export class FamiliaController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  @Get("familia")
  @Papeis("RESPONSAVEL")
  resumo(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, async (tx) => {
      const vinculos = await tx.guardianLink.findMany({ where: { guardianId: s.userId } });
      const gente = await nomes(tx, vinculos.map((v) => v.studentId));
      const skills = await mapaHabilidades(tx);
      const filhos = [];
      for (const v of vinculos) {
        const nome = gente.get(v.studentId)?.nome ?? "";
        if (!v.consentimentoEm) {
          filhos.push({ id: v.studentId, nome, precisaConsentimento: true as const, versaoTermo: VERSAO_TERMO });
          continue;
        }
        const turma = await turmaDoAluno(tx, v.studentId);
        const alertas = await tx.alert.findMany({ where: { studentId: v.studentId, status: { in: ["ABERTO", "ENCAMINHADO"] } }, orderBy: { score: "desc" } });
        const pedidos = await tx.tutoringRequest.findMany({
          where: { alerta: { studentId: v.studentId }, status: { in: ["AGUARDANDO_RESPONSAVEL", "APROVADO", "EM_ANDAMENTO"] } },
          include: { alerta: true, sessoes: { orderBy: { inicio: "asc" } } },
        });
        const tutores = await nomes(tx, pedidos.map((p) => p.tutorId));
        const perfis = await tx.tutorProfile.findMany({ where: { userId: { in: pedidos.map((p) => p.tutorId) } } });
        const dominio = await tx.mastery.findMany({ where: { studentId: v.studentId }, orderBy: { nivel: "desc" }, take: 2 });
        const provas = await tx.assessment.findMany({
          where: { tipo: "PROVA", questoes: { some: { respostas: { some: { studentId: v.studentId } } } } },
          orderBy: { data: "desc" },
          take: 3,
        });
        const notas = [];
        for (const p of provas) {
          const r = await relatorioDaProva(tx, p.id);
          const nota = r.relatorio.students.find((x) => x.studentId === v.studentId);
          if (nota) notas.push({ titulo: p.titulo, materia: r.classSubject.materia.nome, data: p.data, nota: nota.score });
        }
        const professores = turma
          ? await tx.classSubject.findMany({ where: { classId: turma.classId }, include: { materia: true } })
          : [];
        const nomesProf = await nomes(tx, professores.map((p) => p.teacherId));

        filhos.push({
          id: v.studentId,
          nome,
          turma: turma?.turma.nome,
          precisaConsentimento: false as const,
          consentimentoEm: v.consentimentoEm,
          versaoTermo: v.versaoTermo,
          frequencia: (await frequencia(tx, [v.studentId])).get(v.studentId),
          alertas: alertas.map((a) => ({
            frase: a.frase,
            habilidade: skills.get(a.skillId)?.nomeCurto,
            codigo: skills.get(a.skillId)?.codigo,
            status: a.status,
            motivos: (a.motivos as unknown as { reasons: AlertReason[] }).reasons,
          })),
          reforcos: pedidos.map((p) => ({
            id: p.id,
            status: p.status,
            habilidade: skills.get(p.alerta.skillId)?.nomeCurto,
            tutor: tutores.get(p.tutorId)?.nome,
            horarios: perfis.find((x) => x.userId === p.tutorId)?.horarios ?? [],
            plano: p.plano,
            proximaSessao: p.sessoes.find((x) => x.inicio >= new Date())?.inicio ?? null,
          })),
          vaiBemEm: dominio.map((d) => skills.get(d.skillId)?.nomeCurto),
          notas,
          professores: professores.map((p) => ({ id: p.teacherId, nome: nomesProf.get(p.teacherId)?.nome, materia: p.materia.nome })),
        });
      }
      await registrarAcesso(tx, s, "resumo_familia", vinculos.filter((v) => v.consentimentoEm).map((v) => v.studentId));
      return { responsavel: s.nome, filhos };
    });
  }

  /** Consentimento do responsável (LGPD, art. 14), registrado com data e versão do termo. */
  @Post("familia/consentimento")
  @Papeis("RESPONSAVEL")
  consentir(@Usuario() s: Sessao, @Body() corpo: unknown) {
    const p = CorpoConsentimento.safeParse(corpo);
    if (!p.success) throw new BadRequestException({ erro: `Aceite a versão ${VERSAO_TERMO} do termo` });
    return naEscola(this.prisma, s, async (tx) => {
      const v = await exigirFilho(tx, s, p.data.alunoId, false);
      return tx.guardianLink.update({ where: { id: v.id }, data: { consentimentoEm: new Date(), versaoTermo: p.data.versao } });
    });
  }

  @Post("reforco/pedidos/:id/aprovar")
  @Papeis("RESPONSAVEL")
  aprovar(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string) {
    return this.decidir(s, id, "APROVADO");
  }

  @Post("reforco/pedidos/:id/recusar")
  @Papeis("RESPONSAVEL")
  recusar(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string) {
    return this.decidir(s, id, "RECUSADO");
  }

  private decidir(s: Sessao, id: string, status: "APROVADO" | "RECUSADO") {
    return naEscola(this.prisma, s, async (tx) => {
      const pedido = await tx.tutoringRequest.findUnique({ where: { id }, include: { alerta: true } });
      if (!pedido) throw new NotFoundException({ erro: "Pedido de reforço não encontrado" });
      await exigirFilho(tx, s, pedido.alerta.studentId);
      if (pedido.status !== "AGUARDANDO_RESPONSAVEL") throw new ConflictException({ erro: "Este pedido já foi respondido" });
      await tx.tutoringRequest.update({ where: { id }, data: { status, aprovadoPor: s.userId, aprovadoEm: new Date() } });
      // Recusado: o alerta volta para a professora decidir outro caminho.
      if (status === "RECUSADO") await tx.alert.update({ where: { id: pedido.alertId }, data: { status: "ABERTO" } });
      return { ok: true, status };
    });
  }
}

export { exigirFilho };

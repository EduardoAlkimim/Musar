import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { gradeAssessment, matchTutors, type Assessment, type Tutor } from "@escola/domain";
import type { Tx } from "@escola/db";
import { ehGestao, type Sessao } from "./base";

export const primeiroNome = (nome: string) => nome.split(" ")[0]!;

/** Professor só enxerga as turmas em que dá aula; coordenação e admin enxergam todas. */
export async function exigirTurma(tx: Tx, s: Sessao, classId: string) {
  const turma = await tx.schoolClass.findUnique({ where: { id: classId } });
  if (!turma) throw new NotFoundException({ erro: "Turma não encontrada" });
  if (ehGestao(s)) return turma;
  const leciona = await tx.classSubject.count({ where: { classId, teacherId: s.userId } });
  if (!leciona) throw new ForbiddenException({ erro: "Você não dá aula nessa turma" });
  return turma;
}

export async function turmaDoAluno(tx: Tx, studentId: string) {
  return tx.enrollment.findFirst({ where: { studentId }, include: { turma: true } });
}

export async function nomes(tx: Tx, ids: string[]) {
  const us = await tx.user.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, nome: true, dataNascimento: true } });
  return new Map(us.map((u) => [u.id, u]));
}

export async function mapaHabilidades(tx: Tx) {
  const skills = await tx.skill.findMany({ include: { materia: true } });
  return new Map(skills.map((k) => [k.id, k]));
}

/** Os 3 professores de reforço mais indicados para a habilidade, com o porquê. */
export async function sugestoesDeReforco(tx: Tx, skillId: string) {
  const skill = await tx.skill.findUnique({ where: { id: skillId } });
  if (!skill) return [];
  const perfis = await tx.tutorProfile.findMany();
  const gente = await nomes(tx, perfis.map((p) => p.userId));
  const tutores: Tutor[] = perfis.map((p) => ({
    id: p.userId,
    name: gente.get(p.userId)?.nome ?? "",
    specialties: p.especialidades,
    slots: p.horarios,
    history: (p.historico ?? {}) as Tutor["history"],
    mode: p.modo as Tutor["mode"],
  }));
  return matchTutors(skill.codigo, skill.nomeCurto, tutores).map((m) => ({
    id: m.tutor.id,
    nome: m.tutor.name,
    score: m.score,
    motivos: m.reasons,
    horario: m.nextSlot,
    modo: m.tutor.mode === "ambos" ? "presencial ou online" : m.tutor.mode,
  }));
}

/** Monta a avaliação do banco no formato do domínio e corrige pelo gabarito. */
export async function relatorioDaProva(tx: Tx, assessmentId: string) {
  const av = await tx.assessment.findUnique({
    where: { id: assessmentId },
    include: { questoes: { include: { respostas: true }, orderBy: { numero: "asc" } } },
  });
  if (!av) throw new NotFoundException({ erro: "Prova não encontrada" });
  const cs = await tx.classSubject.findUniqueOrThrow({ where: { id: av.classSubjectId }, include: { turma: true, materia: true } });
  const matriculas = await tx.enrollment.findMany({ where: { classId: cs.classId } });
  const dominio: Assessment = {
    id: av.id,
    title: av.titulo,
    date: av.data.toISOString().slice(0, 10),
    classId: cs.classId,
    subject: cs.materia.nome,
    questions: av.questoes.map((q) => ({
      id: q.id,
      number: q.numero,
      statement: q.enunciado,
      options: q.alternativas,
      correct: q.gabarito,
      skill: q.skillId,
      distractors: (q.distratores ?? undefined) as Record<number, string> | undefined,
    })),
  };
  const respostas = av.questoes.flatMap((q) => q.respostas.map((r) => ({ studentId: r.studentId, questionId: q.id, chosen: r.marcada, timeSeconds: r.tempoSeg ?? undefined })));
  const quemFez = new Set(respostas.map((r) => r.studentId));
  const relatorio = gradeAssessment(dominio, matriculas.map((m) => m.studentId).filter((id) => quemFez.has(id)), respostas);
  return { avaliacao: av, classSubject: cs, dominio, relatorio, respostas };
}

/** Frequência dos últimos 45 dias, 0 a 1. */
export async function frequencia(tx: Tx, studentIds: string[], hoje = new Date()) {
  const desde = new Date(hoje.getTime() - 45 * 86_400_000);
  const linhas = await tx.attendance.groupBy({ by: ["studentId", "presente"], where: { studentId: { in: studentIds }, data: { gte: desde } }, _count: true });
  const out = new Map<string, number>();
  for (const id of studentIds) {
    const p = linhas.find((l) => l.studentId === id && l.presente)?._count ?? 0;
    const f = linhas.find((l) => l.studentId === id && !l.presente)?._count ?? 0;
    out.set(id, p + f === 0 ? 1 : p / (p + f));
  }
  return out;
}

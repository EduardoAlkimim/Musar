import { computeMastery, evaluateStudent, type Skill, type SkillEvidence } from "@escola/domain";
import type { Tx } from "./index";

const DIA = 86_400_000;

/**
 * Detector proativo persistido. Recalcula o domínio por habilidade e abre, atualiza
 * ou resolve alertas. Roda dentro de uma transação já presa à escola (comEscola).
 */
export async function rodarDetector(tx: Tx, schoolId: string, opts: { classId?: string; hoje?: Date } = {}) {
  const hoje = opts.hoje ?? new Date();
  const skills = await tx.skill.findMany();
  const dominioSkills: Skill[] = skills.map((s) => ({ code: s.id, shortName: s.nomeCurto, description: s.descricao, subject: s.subjectId }));

  const turmas = await tx.classSubject.findMany({ where: opts.classId ? { classId: opts.classId } : {} });
  const classIds = [...new Set(turmas.map((t) => t.classId))];
  const matriculas = await tx.enrollment.findMany({ where: { classId: { in: classIds } } });
  const alunos = await tx.user.findMany({ where: { id: { in: matriculas.map((m) => m.studentId) } }, select: { id: true, nome: true } });
  const nome = new Map(alunos.map((a) => [a.id, a.nome.split(" ")[0]!]));

  const avaliacoes = await tx.assessment.findMany({
    where: { classSubjectId: { in: turmas.map((t) => t.id) } },
    include: { questoes: { include: { respostas: true } } },
    orderBy: { data: "asc" },
  });
  const turmaDaAvaliacao = new Map(turmas.map((t) => [t.id, t.classId]));

  const evidencia = new Map<string, SkillEvidence[]>();
  const respondeu = new Map<string, Set<string>>(); // assessmentId → alunos com resposta
  for (const av of avaliacoes) {
    const quem = new Set<string>();
    const contas = new Map<string, Map<string, { correct: number; total: number }>>();
    for (const q of av.questoes) {
      for (const r of q.respostas) {
        quem.add(r.studentId);
        const doAluno = contas.get(r.studentId) ?? new Map();
        const c = doAluno.get(q.skillId) ?? { correct: 0, total: 0 };
        c.total += 1;
        if (r.marcada === q.gabarito) c.correct += 1;
        doAluno.set(q.skillId, c);
        contas.set(r.studentId, doAluno);
      }
    }
    respondeu.set(av.id, quem);
    const date = av.data.toISOString().slice(0, 10);
    for (const [aluno, porSkill] of contas) {
      const lista = evidencia.get(aluno) ?? [];
      for (const [skill, c] of porSkill) lista.push({ date, skill, ...c });
      evidencia.set(aluno, lista);
    }
  }

  const desde = new Date(hoje.getTime() - 45 * DIA);
  const presencas = await tx.attendance.findMany({ where: { classId: { in: classIds }, data: { gte: desde } } });
  const freq = new Map<string, { p: number; t: number }>();
  for (const a of presencas) {
    const f = freq.get(a.studentId) ?? { p: 0, t: 0 };
    f.t += 1;
    if (a.presente) f.p += 1;
    freq.set(a.studentId, f);
  }

  const tarefasRecentes = avaliacoes.filter((a) => a.tipo === "TAREFA" && a.data.getTime() >= hoje.getTime() - 14 * DIA && a.data <= hoje);

  // Descartado pela professora nos últimos 30 dias não volta a aparecer.
  const abertos = await tx.alert.findMany({
    where: {
      studentId: { in: matriculas.map((m) => m.studentId) },
      OR: [{ status: { in: ["ABERTO", "ENCAMINHADO"] } }, { status: "DESCARTADO", createdAt: { gte: new Date(hoje.getTime() - 30 * DIA) } }],
    },
  });
  const chave = (s: string, k: string) => `${s}|${k}`;
  const existentes = new Map(abertos.map((a) => [chave(a.studentId, a.skillId), a]));
  const vistos = new Set<string>();
  let criados = 0;
  let atualizados = 0;

  for (const m of matriculas) {
    const ev = evidencia.get(m.studentId) ?? [];
    const dominio = computeMastery(ev);
    for (const [skillId, nivel] of Object.entries(dominio)) {
      await tx.mastery.upsert({
        where: { studentId_skillId: { studentId: m.studentId, skillId } },
        create: { schoolId, studentId: m.studentId, skillId, nivel },
        update: { nivel },
      });
    }

    const f = freq.get(m.studentId);
    const faltando = tarefasRecentes.filter((t) => turmaDaAvaliacao.get(t.classSubjectId) === m.classId && !respondeu.get(t.id)?.has(m.studentId)).length;
    const alertas = evaluateStudent(
      { studentId: m.studentId, firstName: nome.get(m.studentId) ?? "", evidence: ev, attendance: f && f.t ? f.p / f.t : 1, missingTasks: faltando },
      dominioSkills,
    );

    for (const a of alertas) {
      const k = chave(a.studentId, a.skill);
      vistos.add(k);
      const atual = existentes.get(k);
      const dados = { score: a.score, frase: a.headline, motivos: { reasons: a.reasons.map((r) => ({ text: r.text, points: r.points })), mastery: a.mastery, drop: a.drop } };
      if (!atual) {
        await tx.alert.create({ data: { schoolId, studentId: a.studentId, skillId: a.skill, ...dados } });
        criados += 1;
      } else if (atual.status === "ABERTO") {
        await tx.alert.update({ where: { id: atual.id }, data: dados });
        atualizados += 1;
      }
    }
  }

  // Alerta aberto que deixou de valer: a habilidade se recuperou.
  const resolver = abertos.filter((a) => a.status === "ABERTO" && !vistos.has(chave(a.studentId, a.skillId))).map((a) => a.id);
  if (resolver.length) await tx.alert.updateMany({ where: { id: { in: resolver } }, data: { status: "RESOLVIDO" } });

  return { alunos: matriculas.length, criados, atualizados, resolvidos: resolver.length };
}

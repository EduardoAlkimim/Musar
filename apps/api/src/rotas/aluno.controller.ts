import { Controller, Get, Inject } from "@nestjs/common";
import type { PrismaClient } from "@escola/db";
import { naEscola, Papeis, PRISMA, Usuario, type Sessao } from "../base";
import { mapaHabilidades, nomes, relatorioDaProva, turmaDoAluno } from "../consultas";

@Controller("aluno")
export class AlunoController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  /** "Seu próximo passo": revisar o erro da última prova e acompanhar o reforço. */
  @Get()
  @Papeis("ALUNO")
  inicio(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, async (tx) => {
      const turma = await turmaDoAluno(tx, s.userId);
      const skills = await mapaHabilidades(tx);
      const ultima = await tx.assessment.findFirst({
        where: { tipo: "PROVA", questoes: { some: { respostas: { some: { studentId: s.userId } } } } },
        orderBy: { data: "desc" },
      });

      let prova = null;
      if (ultima) {
        const r = await relatorioDaProva(tx, ultima.id);
        const minha = r.relatorio.students.find((x) => x.studentId === s.userId)!;
        const marcadas = new Map(r.respostas.filter((x) => x.studentId === s.userId).map((x) => [x.questionId, x.chosen]));
        const erradas = r.dominio.questions
          .filter((q) => minha.wrongQuestionIds.includes(q.id))
          .map((q) => {
            const marcada = marcadas.get(q.id) ?? null;
            return {
              numero: q.number,
              enunciado: q.statement,
              alternativas: q.options,
              gabarito: q.correct,
              marcada,
              habilidade: skills.get(q.skill)?.nomeCurto,
              /** O que a alternativa marcada costuma revelar, quando o professor cadastrou. */
              indica: marcada === null ? null : (q.distractors?.[marcada] ?? null),
              acertoDaTurma: r.relatorio.questions.find((x) => x.questionId === q.id)?.pctCorrect,
            };
          })
          // Primeiro o erro que mais gente acertou: é o mais fácil de recuperar.
          .sort((a, b) => (b.acertoDaTurma ?? 0) - (a.acertoDaTurma ?? 0));
        prova = { titulo: ultima.titulo, materia: r.classSubject.materia.nome, data: ultima.data, nota: minha.score, erradas };
      }

      const pedidos = await tx.tutoringRequest.findMany({
        where: { alerta: { studentId: s.userId }, status: { in: ["AGUARDANDO_RESPONSAVEL", "APROVADO", "EM_ANDAMENTO"] } },
        include: { alerta: true, sessoes: { orderBy: { inicio: "asc" } } },
      });
      const tutores = await nomes(tx, pedidos.map((p) => p.tutorId));
      const proximas = !turma ? [] : await tx.assessment.findMany({
        where: { classSubject: { classId: turma.classId }, data: { gte: new Date(new Date().toDateString()) } },
        include: { classSubject: { include: { materia: true } } },
        orderBy: { data: "asc" },
        take: 5,
      });

      return {
        nome: s.nome,
        turma: turma?.turma.nome,
        prova,
        reforcos: pedidos.map((p) => ({
          status: p.status,
          habilidade: skills.get(p.alerta.skillId)?.nomeCurto,
          tutor: tutores.get(p.tutorId)?.nome,
          sessoes: p.sessoes.filter((x) => x.inicio >= new Date()).map((x) => ({ inicio: x.inicio, modo: x.modo })),
        })),
        agenda: proximas.map((a) => ({ titulo: a.titulo, materia: a.classSubject.materia.nome, data: a.data, tipo: a.tipo })),
      };
    });
  }
}

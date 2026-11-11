import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Inject, NotFoundException, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { ehMenor, sessoesDoPlano, summarizeAlerts, type AlertReason } from "@escola/domain";
import { rodarDetector, type PrismaClient } from "@escola/db";
import { ehGestao, naEscola, Papeis, PRISMA, registrarAcesso, Usuario, type Sessao } from "../base";
import { exigirTurma, mapaHabilidades, nomes, primeiroNome, relatorioDaProva, sugestoesDeReforco } from "../consultas";

const CorpoRespostas = z.object({
  respostas: z
    .array(z.object({ alunoId: z.string().uuid(), numero: z.number().int().min(1), marcada: z.number().int().min(0).max(4).nullable() }))
    .min(1)
    .max(5000),
});
const CorpoEncaminhar = z.object({ tutorId: z.string().uuid() });
const CorpoProva = z.object({
  atribuicaoId: z.string().uuid(),
  titulo: z.string().trim().min(3).max(160),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipo: z.enum(["PROVA", "SIMULADO", "TAREFA"]).default("PROVA"),
  questoes: z
    .array(
      z.object({
        enunciado: z.string().trim().max(2000).default(""),
        alternativas: z.array(z.string().trim().max(400)).min(2).max(5),
        gabarito: z.number().int().min(0).max(4),
        habilidadeId: z.string().uuid(),
        distratores: z.record(z.string(), z.string().max(200)).optional(),
      }),
    )
    .min(1)
    .max(100),
});

@Controller()
export class ProfessorController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  /** "Quem precisa de você hoje": alertas, mapa da turma e última prova. */
  @Get("professor/painel")
  @Papeis("PROFESSOR", "DIRETOR", "COORDENADOR", "ADMIN")
  painel(@Usuario() s: Sessao, @Query("turma") turmaPedida?: string) {
    return naEscola(this.prisma, s, async (tx) => {
      const atribuicoes = await tx.classSubject.findMany({
        where: ehGestao(s) && !s.papeis.includes("PROFESSOR") ? {} : { teacherId: s.userId },
        include: { turma: true, materia: true },
        orderBy: { turma: { nome: "asc" } },
      });
      if (atribuicoes.length === 0) return { turmas: [], turma: null };

      const alunosPorTurma = new Map<string, string[]>();
      for (const m of await tx.enrollment.findMany({ where: { classId: { in: atribuicoes.map((a) => a.classId) } } })) {
        alunosPorTurma.set(m.classId, [...(alunosPorTurma.get(m.classId) ?? []), m.studentId]);
      }
      const skills = await mapaHabilidades(tx);
      const skillsDe = (subjectId: string) => [...skills.values()].filter((k) => k.subjectId === subjectId);
      const abertos = await tx.alert.findMany({ where: { status: "ABERTO" }, orderBy: { score: "desc" } });
      const contagem = (a: (typeof atribuicoes)[number]) => {
        const alunos = new Set(alunosPorTurma.get(a.classId) ?? []);
        const ks = new Set(skillsDe(a.subjectId).map((k) => k.id));
        return abertos.filter((x) => alunos.has(x.studentId) && ks.has(x.skillId));
      };

      // Turma escolhida, ou a que mais precisa de atenção.
      const atual = (turmaPedida && atribuicoes.find((a) => a.id === turmaPedida)) || [...atribuicoes].sort((a, b) => contagem(b).length - contagem(a).length)[0]!;
      const alunos = alunosPorTurma.get(atual.classId) ?? [];
      const gente = await nomes(tx, alunos);
      const habilidades = skillsDe(atual.subjectId);
      const alertas = contagem(atual);
      const dominio = await tx.mastery.findMany({ where: { studentId: { in: alunos }, skillId: { in: habilidades.map((h) => h.id) } } });
      const encaminhados = await tx.alert.count({ where: { status: "ENCAMINHADO", studentId: { in: alunos }, skillId: { in: habilidades.map((h) => h.id) } } });

      const resumo = summarizeAlerts(
        alertas.map((a) => ({ studentId: a.studentId, skill: a.skillId, score: a.score, headline: a.frase, reasons: [], mastery: 0, drop: 0 })),
        habilidades.map((h) => ({ code: h.id, shortName: h.nomeCurto, description: h.descricao, subject: h.subjectId })),
      );
      const sugestoes: Record<string, Awaited<ReturnType<typeof sugestoesDeReforco>>> = {};
      for (const k of new Set(alertas.map((a) => a.skillId))) sugestoes[k] = await sugestoesDeReforco(tx, k);

      const ultimaProva = await tx.assessment.findFirst({ where: { classSubjectId: atual.id, tipo: "PROVA" }, orderBy: { data: "desc" } });
      const prova = ultimaProva ? await relatorioDaProva(tx, ultimaProva.id) : null;
      const naoLidas = await tx.message.count({ where: { toUserId: s.userId, lidaEm: null } });
      await registrarAcesso(tx, s, "painel_professor");

      return {
        turmas: atribuicoes.map((a) => ({ id: a.id, turma: a.turma.nome, materia: a.materia.nome, alertas: contagem(a).length })),
        turma: { id: atual.id, classId: atual.classId, nome: atual.turma.nome, materia: atual.materia.nome },
        resumo: resumo && { ...resumo, habilidade: skills.get(resumo.skill)?.nomeCurto, nomes: resumo.studentIds.map((id) => primeiroNome(gente.get(id)?.nome ?? "")) },
        alertas: alertas.map((a) => {
          const m = a.motivos as unknown as { reasons: AlertReason[]; mastery: number };
          const k = skills.get(a.skillId)!;
          return { id: a.id, aluno: { id: a.studentId, nome: gente.get(a.studentId)?.nome ?? "" }, habilidade: { id: k.id, codigo: k.codigo, nome: k.nomeCurto }, frase: a.frase, score: a.score, motivos: m.reasons, dominio: m.mastery };
        }),
        encaminhados,
        sugestoes,
        mapa: {
          habilidades: habilidades.map((h) => ({ id: h.id, codigo: h.codigo, nome: h.nomeCurto })),
          alunos: alunos.map((id) => ({ id, nome: gente.get(id)?.nome ?? "" })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
          dominio: Object.fromEntries(alunos.map((id) => [id, Object.fromEntries(dominio.filter((d) => d.studentId === id).map((d) => [d.skillId, d.nivel]))])),
        },
        prova: prova && {
          id: prova.avaliacao.id,
          titulo: prova.avaliacao.titulo,
          media: prova.relatorio.average,
          questoesComAtencao: prova.relatorio.questions.filter((q) => q.flags.length).length,
        },
        mensagensNaoLidas: naoLidas,
      };
    });
  }

  /** Turmas, matérias e habilidades da professora: base para criar prova. */
  @Get("professor/atribuicoes")
  @Papeis("PROFESSOR")
  atribuicoes(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, async (tx) => {
      const as = await tx.classSubject.findMany({ where: { teacherId: s.userId }, include: { turma: true, materia: { include: { habilidades: true } } }, orderBy: { turma: { nome: "asc" } } });
      const provas = await tx.assessment.findMany({ where: { classSubjectId: { in: as.map((a) => a.id) }, tipo: { in: ["PROVA", "SIMULADO"] } }, orderBy: { data: "desc" }, take: 30 });
      return {
        atribuicoes: as.map((a) => ({
          id: a.id,
          turma: a.turma.nome,
          materia: a.materia.nome,
          habilidades: a.materia.habilidades.map((h) => ({ id: h.id, codigo: h.codigo, nome: h.nomeCurto, descricao: h.descricao })).sort((x, y) => x.codigo.localeCompare(y.codigo)),
        })),
        provas: provas.map((p) => ({ id: p.id, titulo: p.titulo, data: p.data, tipo: p.tipo, turma: as.find((a) => a.id === p.classSubjectId)?.turma.nome })),
      };
    });
  }

  /** Cria a prova com o gabarito. A correção depois é automática, pelo gabarito. */
  @Post("provas")
  @Papeis("PROFESSOR")
  criarProva(@Usuario() s: Sessao, @Body() corpo: unknown) {
    const p = CorpoProva.safeParse(corpo);
    if (!p.success) throw new BadRequestException({ erro: "Prova incompleta", detalhes: p.error.issues });
    return naEscola(this.prisma, s, async (tx) => {
      const cs = await tx.classSubject.findUnique({ where: { id: p.data.atribuicaoId } });
      if (!cs || cs.teacherId !== s.userId) throw new ForbiddenException({ erro: "Você não dá essa matéria nessa turma" });
      const validas = new Set((await tx.skill.findMany({ where: { subjectId: cs.subjectId } })).map((k) => k.id));
      p.data.questoes.forEach((q, i) => {
        if (!validas.has(q.habilidadeId)) throw new BadRequestException({ erro: `Questão ${i + 1}: habilidade de outra matéria` });
        if (q.gabarito >= q.alternativas.length) throw new BadRequestException({ erro: `Questão ${i + 1}: gabarito fora das alternativas` });
      });
      const av = await tx.assessment.create({
        data: {
          schoolId: s.schoolId,
          classSubjectId: cs.id,
          titulo: p.data.titulo,
          data: new Date(`${p.data.data}T00:00:00Z`),
          tipo: p.data.tipo,
          questoes: {
            create: p.data.questoes.map((q, i) => ({
              schoolId: s.schoolId,
              numero: i + 1,
              enunciado: q.enunciado || `Questão ${i + 1}`,
              alternativas: q.alternativas,
              gabarito: q.gabarito,
              skillId: q.habilidadeId,
              distratores: q.distratores ?? {},
            })),
          },
        },
      });
      return { id: av.id };
    });
  }

  /** Alunos da turma da prova e respostas já lançadas, para a tela de lançamento. */
  @Get("provas/:id/lancamento")
  @Papeis("PROFESSOR")
  lancamento(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string) {
    return naEscola(this.prisma, s, async (tx) => {
      const av = await tx.assessment.findUnique({ where: { id }, include: { questoes: { include: { respostas: true }, orderBy: { numero: "asc" } } } });
      if (!av) throw new NotFoundException({ erro: "Prova não encontrada" });
      const cs = await tx.classSubject.findUniqueOrThrow({ where: { id: av.classSubjectId }, include: { turma: true, materia: true } });
      if (cs.teacherId !== s.userId) throw new ForbiddenException({ erro: "Só quem dá a matéria lança as respostas" });
      const alunos = await tx.enrollment.findMany({ where: { classId: cs.classId } });
      const gente = await nomes(tx, alunos.map((a) => a.studentId));
      return {
        prova: { id: av.id, titulo: av.titulo, data: av.data, turma: cs.turma.nome, materia: cs.materia.nome },
        questoes: av.questoes.map((q) => ({ numero: q.numero, alternativas: q.alternativas.length, gabarito: q.gabarito })),
        alunos: alunos
          .map((a) => ({
            id: a.studentId,
            nome: gente.get(a.studentId)?.nome ?? "",
            respostas: av.questoes.map((q) => {
              const r = q.respostas.find((x) => x.studentId === a.studentId);
              return r === undefined ? undefined : r.marcada;
            }),
          }))
          .sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR")),
      };
    });
  }

  @Get("provas/:id/relatorio")
  @Papeis("PROFESSOR", "DIRETOR", "COORDENADOR", "ADMIN")
  relatorio(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string) {
    return naEscola(this.prisma, s, async (tx) => {
      const r = await relatorioDaProva(tx, id);
      await exigirTurma(tx, s, r.classSubject.classId);
      const skills = await mapaHabilidades(tx);
      const gente = await nomes(tx, r.relatorio.students.map((x) => x.studentId));
      await registrarAcesso(tx, s, "relatorio_prova");
      return {
        prova: { id: r.avaliacao.id, titulo: r.avaliacao.titulo, data: r.dominio.date, turma: r.classSubject.turma.nome, materia: r.classSubject.materia.nome },
        questoes: r.dominio.questions.map((q) => ({ ...q, stats: r.relatorio.questions.find((x) => x.questionId === q.id)! })),
        alunos: r.relatorio.students.map((x) => ({ ...x, nome: gente.get(x.studentId)?.nome ?? "" })),
        media: r.relatorio.average,
        habilidades: Object.fromEntries([...new Set(r.dominio.questions.map((q) => q.skill))].map((k) => [k, { codigo: skills.get(k)?.codigo, nome: skills.get(k)?.nomeCurto }])),
      };
    });
  }

  /** Lança respostas (digitadas ou lidas do cartão), corrige pelo gabarito e recalcula os alertas da turma. */
  @Post("provas/:id/respostas")
  @Papeis("PROFESSOR")
  async lancarRespostas(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string, @Body() corpo: unknown) {
    const p = CorpoRespostas.safeParse(corpo);
    if (!p.success) throw new BadRequestException({ erro: "Respostas inválidas", detalhes: p.error.issues });
    await naEscola(this.prisma, s, async (tx) => {
      const av = await tx.assessment.findUnique({ where: { id }, include: { questoes: true } });
      if (!av) throw new NotFoundException({ erro: "Prova não encontrada" });
      const cs = await tx.classSubject.findUniqueOrThrow({ where: { id: av.classSubjectId } });
      if (cs.teacherId !== s.userId) throw new ForbiddenException({ erro: "Só quem dá a matéria lança as respostas" });
      const matriculados = new Set((await tx.enrollment.findMany({ where: { classId: cs.classId } })).map((m) => m.studentId));
      const questao = new Map(av.questoes.map((q) => [q.numero, q]));
      for (const r of p.data.respostas) {
        const q = questao.get(r.numero);
        if (!q || !matriculados.has(r.alunoId)) throw new BadRequestException({ erro: "Aluno ou questão fora desta prova", resposta: r });
        if (r.marcada !== null && r.marcada >= q.alternativas.length) throw new BadRequestException({ erro: `A questão ${q.numero} tem ${q.alternativas.length} alternativas` });
        await tx.answer.upsert({
          where: { questionId_studentId: { questionId: q.id, studentId: r.alunoId } },
          create: { schoolId: s.schoolId, questionId: q.id, studentId: r.alunoId, marcada: r.marcada },
          update: { marcada: r.marcada },
        });
      }
      await rodarDetector(tx, s.schoolId, { classId: cs.classId });
    });
    return this.relatorio(s, id);
  }

  /** Encaminhar ao reforço. Menor de idade fica aguardando o responsável. */
  @Post("alertas/:id/encaminhar")
  @Papeis("PROFESSOR", "DIRETOR", "COORDENADOR")
  async encaminhar(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string, @Body() corpo: unknown) {
    const p = CorpoEncaminhar.safeParse(corpo);
    if (!p.success) throw new BadRequestException({ erro: "Escolha o professor de reforço" });
    return naEscola(this.prisma, s, async (tx) => {
      const alerta = await tx.alert.findUnique({ where: { id } });
      if (!alerta) throw new NotFoundException({ erro: "Alerta não encontrado" });
      if (alerta.status !== "ABERTO") throw new ConflictException({ erro: "Este alerta já foi encaminhado ou resolvido" });
      const mat = await tx.enrollment.findFirstOrThrow({ where: { studentId: alerta.studentId } });
      await exigirTurma(tx, s, mat.classId);
      const tutor = await tx.tutorProfile.findUnique({ where: { schoolId_userId: { schoolId: s.schoolId, userId: p.data.tutorId } } });
      if (!tutor) throw new BadRequestException({ erro: "Professor de reforço não encontrado nesta escola" });
      const aluno = await tx.user.findUniqueOrThrow({ where: { id: alerta.studentId } });
      const dominio = (alerta.motivos as { mastery?: number }).mastery ?? 50;
      const menor = ehMenor(aluno.dataNascimento);

      const pedido = await tx.tutoringRequest.create({
        data: {
          schoolId: s.schoolId,
          alertId: alerta.id,
          tutorId: tutor.userId,
          pedidoPor: s.userId,
          plano: { sessoes: sessoesDoPlano(dominio), minutos: 50, saida: "4 de 5 acertos na mini-avaliação" },
          status: menor ? "AGUARDANDO_RESPONSAVEL" : "APROVADO",
        },
      });
      await tx.alert.update({ where: { id: alerta.id }, data: { status: "ENCAMINHADO" } });
      return { id: pedido.id, status: pedido.status, tutor: (await nomes(tx, [tutor.userId])).get(tutor.userId)?.nome };
    });
  }

  @Post("alertas/:id/descartar")
  @Papeis("PROFESSOR", "DIRETOR", "COORDENADOR")
  descartar(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string) {
    return naEscola(this.prisma, s, async (tx) => {
      const alerta = await tx.alert.findUnique({ where: { id } });
      if (!alerta || alerta.status !== "ABERTO") throw new NotFoundException({ erro: "Alerta aberto não encontrado" });
      const mat = await tx.enrollment.findFirstOrThrow({ where: { studentId: alerta.studentId } });
      await exigirTurma(tx, s, mat.classId);
      await tx.alert.update({ where: { id }, data: { status: "DESCARTADO" } });
      return { ok: true };
    });
  }
}

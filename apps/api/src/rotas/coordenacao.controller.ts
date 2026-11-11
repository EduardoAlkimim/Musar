import { Controller, Get, Inject, Post } from "@nestjs/common";
import { rodarDetector, type PrismaClient } from "@escola/db";
import { naEscola, Papeis, PRISMA, registrarAcesso, Usuario, type Sessao } from "../base";
import { mapaHabilidades, nomes } from "../consultas";

/** Bimestre pelo mês: 1º fev–abr, 2º mai–jul, 3º ago–set, 4º out–dez. */
const bimestre = (d: Date) => {
  const m = d.getUTCMonth() + 1;
  return m <= 4 ? 1 : m <= 7 ? 2 : m <= 9 ? 3 : 4;
};
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const DIA = 86_400_000;

@Controller()
export class CoordenacaoController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  @Get("coordenacao")
  @Papeis("DIRETOR", "COORDENADOR", "ADMIN")
  painel(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, async (tx) => {
      const turmas = await tx.schoolClass.findMany({ orderBy: { nome: "asc" } });
      const atribuicoes = await tx.classSubject.findMany({ include: { materia: true } });
      const avaliacoes = await tx.assessment.findMany({ include: { questoes: { include: { respostas: true } } } });
      const agora = new Date();
      const bimAtual = bimestre(agora);

      // Média de 0 a 10 por turma e matéria, no bimestre atual e no anterior.
      const notas = new Map<string, { atual: number[]; anterior: number[] }>();
      const ultimaAtividade = new Map<string, Date>();
      for (const av of avaliacoes) {
        const cs = atribuicoes.find((a) => a.id === av.classSubjectId);
        if (!cs) continue;
        if (av.data <= agora && (!ultimaAtividade.get(cs.teacherId) || av.data > ultimaAtividade.get(cs.teacherId)!)) ultimaAtividade.set(cs.teacherId, av.data);
        const b = bimestre(av.data);
        if (b !== bimAtual && b !== bimAtual - 1) continue;
        const porAluno = new Map<string, { c: number; t: number }>();
        for (const q of av.questoes) for (const r of q.respostas) {
          const x = porAluno.get(r.studentId) ?? { c: 0, t: 0 };
          x.t += 1;
          if (r.marcada === q.gabarito) x.c += 1;
          porAluno.set(r.studentId, x);
        }
        const k = `${cs.classId}|${cs.materia.nome}`;
        const slot = notas.get(k) ?? { atual: [], anterior: [] };
        for (const x of porAluno.values()) (b === bimAtual ? slot.atual : slot.anterior).push((x.c / x.t) * 10);
        notas.set(k, slot);
      }
      const materias = [...new Set(atribuicoes.map((a) => a.materia.nome))].sort((a, b) => (a === "Matemática" ? -1 : b === "Matemática" ? 1 : a.localeCompare(b, "pt-BR")));
      const tabela = turmas.map((t) => ({
        turma: { id: t.id, nome: t.nome },
        materias: materias.map((m) => {
          const n = notas.get(`${t.id}|${m}`);
          return { materia: m, atual: n ? media(n.atual) : null, anterior: n ? media(n.anterior) : null };
        }),
      }));

      // Alertas por turma (alunos distintos) e professores sem lançar atividade há mais de 14 dias.
      const matriculas = await tx.enrollment.findMany();
      const turmaDe = new Map(matriculas.map((m) => [m.studentId, m.classId]));
      const skills = await mapaHabilidades(tx);
      const alertas = await tx.alert.findMany({ where: { status: { in: ["ABERTO", "ENCAMINHADO"] } } });
      const porTurma = turmas.map((t) => {
        const daTurma = alertas.filter((a) => turmaDe.get(a.studentId) === t.id);
        return { turma: t.nome, alunos: new Set(daTurma.map((a) => a.studentId)).size, habilidades: [...new Set(daTurma.map((a) => skills.get(a.skillId)?.nomeCurto))] };
      });
      const profs = [...new Set(atribuicoes.map((a) => a.teacherId))];
      const gente = await nomes(tx, profs);
      const professores = profs.map((id) => ({
        id,
        nome: gente.get(id)?.nome ?? "",
        turmas: atribuicoes.filter((a) => a.teacherId === id).map((a) => turmas.find((t) => t.id === a.classId)?.nome).filter(Boolean),
        materias: [...new Set(atribuicoes.filter((a) => a.teacherId === id).map((a) => a.materia.nome))],
        ultimaAtividade: ultimaAtividade.get(id) ?? null,
        diasSemAtividade: ultimaAtividade.get(id) ? Math.floor((agora.getTime() - ultimaAtividade.get(id)!.getTime()) / DIA) : null,
      }));

      // Mesmo conteúdo, professores diferentes: domínio médio por habilidade de Matemática.
      const mat = atribuicoes.filter((a) => a.materia.nome === "Matemática");
      const profsMat = [...new Set(mat.map((a) => a.teacherId))];
      const habilidadesMat = [...skills.values()].filter((k) => k.materia.nome === "Matemática");
      const dominio = await tx.mastery.findMany({ where: { skillId: { in: habilidadesMat.map((k) => k.id) } } });
      const comparacao = habilidadesMat.map((k) => ({
        habilidade: { codigo: k.codigo, nome: k.nomeCurto },
        porProfessor: profsMat.map((p) => {
          const classes = new Set(mat.filter((a) => a.teacherId === p).map((a) => a.classId));
          const ns = dominio.filter((d) => d.skillId === k.id && classes.has(turmaDe.get(d.studentId) ?? "")).map((d) => d.nivel);
          return { professor: gente.get(p)?.nome ?? "", turmas: [...classes].map((c) => turmas.find((t) => t.id === c)?.nome), media: ns.length ? Math.round(media(ns)!) : null };
        }),
      }));

      await registrarAcesso(tx, s, "painel_coordenacao");
      return { bimestre: bimAtual, materias, tabela, alertasPorTurma: porTurma, professores, comparacao };
    });
  }

  @Post("detector/rodar")
  @Papeis("DIRETOR", "COORDENADOR", "ADMIN")
  rodar(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, (tx) => rodarDetector(tx, s.schoolId));
  }
}

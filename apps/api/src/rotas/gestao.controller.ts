import { Controller, Get, Inject, NotFoundException, Param, ParseUUIDPipe } from "@nestjs/common";
import type { AlertReason, Tutor } from "@escola/domain";
import type { PrismaClient, Tx } from "@escola/db";
import { naEscola, Papeis, PRISMA, registrarAcesso, Usuario, type Sessao } from "../base";
import { frequencia, mapaHabilidades, nomes, sugestoesDeReforco } from "../consultas";

const DIA = 86_400_000;
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const bimestre = (d: Date) => {
  const m = d.getUTCMonth() + 1;
  return m <= 4 ? 1 : m <= 7 ? 2 : m <= 9 ? 3 : 4;
};
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const r1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

/** Nota de 0 a 10 de cada aluno em cada avaliação, a partir das respostas. */
async function notas(tx: Tx) {
  const atribuicoes = await tx.classSubject.findMany({ include: { materia: true } });
  const avaliacoes = await tx.assessment.findMany({ include: { questoes: { include: { respostas: true } } }, orderBy: { data: "asc" } });
  return avaliacoes.flatMap((av) => {
    const cs = atribuicoes.find((a) => a.id === av.classSubjectId);
    if (!cs) return [];
    const porAluno = new Map<string, { c: number; t: number }>();
    for (const q of av.questoes) for (const r of q.respostas) {
      const x = porAluno.get(r.studentId) ?? { c: 0, t: 0 };
      x.t += 1;
      if (r.marcada === q.gabarito) x.c += 1;
      porAluno.set(r.studentId, x);
    }
    return [{ id: av.id, classId: cs.classId, materia: cs.materia.nome, teacherId: cs.teacherId, data: av.data, notas: new Map([...porAluno].map(([k, v]) => [k, (v.c / v.t) * 10])) }];
  });
}

const nivel = (score: number) => (score >= 65 ? "alto" : score >= 55 ? "medio" : "baixo");

@Controller("gestao")
export class GestaoController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  /** Painel geral da escola, para a direção e a coordenação. */
  @Get("visao-geral")
  @Papeis("DIRETOR", "COORDENADOR", "ADMIN")
  visaoGeral(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, async (tx) => {
      const agora = new Date();
      const matriculas = await tx.enrollment.findMany({ include: { turma: true } });
      const turmaDe = new Map(matriculas.map((m) => [m.studentId, m.turma]));
      const alertas = await tx.alert.findMany({ where: { status: { in: ["ABERTO", "ENCAMINHADO"] } }, orderBy: { score: "desc" } });
      const pedidos = await tx.tutoringRequest.findMany({ orderBy: { createdAt: "desc" } });
      const ativos = pedidos.filter((p) => ["AGUARDANDO_RESPONSAVEL", "APROVADO", "EM_ANDAMENTO"].includes(p.status));
      const perfis = await tx.tutorProfile.findMany();
      let fechados = 0, atendidos = 0;
      for (const p of perfis) for (const h of Object.values((p.historico ?? {}) as Tutor["history"])) { fechados += h.closed; atendidos += h.total; }

      const ns = await notas(tx);
      const bim = bimestre(agora);
      const doBim = (b: number) => ns.filter((n) => bimestre(n.data) === b && n.data <= agora).flatMap((n) => [...n.notas.values()]);
      const mediaAtual = r1(media(doBim(bim)));
      const mediaAnterior = r1(media(doBim(bim - 1)));

      // Evolução: média mensal por turma (e da escola) nos últimos meses com atividade.
      const meses = [...new Set(ns.filter((n) => n.data <= agora).map((n) => n.data.getUTCFullYear() * 12 + n.data.getUTCMonth()))].sort().slice(-4);
      const turmas = await tx.schoolClass.findMany({ orderBy: { nome: "asc" } });
      const serie = (filtro: (n: (typeof ns)[number]) => boolean) =>
        meses.map((m) => r1(media(ns.filter((n) => filtro(n) && n.data.getUTCFullYear() * 12 + n.data.getUTCMonth() === m).flatMap((n) => [...n.notas.values()]))));
      const evolucao = {
        meses: meses.map((m) => MESES[m % 12]!),
        escola: serie(() => true),
        turmas: turmas.map((t) => ({ id: t.id, nome: t.nome, valores: serie((n) => n.classId === t.id) })),
      };

      // Risco por disciplina: % de alunos com média abaixo de 6 no bimestre atual.
      const materias = [...new Set(ns.map((n) => n.materia))];
      const riscoPorMateria = materias
        .map((m) => {
          const porAluno = new Map<string, number[]>();
          for (const n of ns.filter((x) => x.materia === m && bimestre(x.data) === bim && x.data <= agora)) for (const [a, v] of n.notas) porAluno.set(a, [...(porAluno.get(a) ?? []), v]);
          const medias = [...porAluno.values()].map((v) => media(v)!);
          return { materia: m, percentual: medias.length ? Math.round((medias.filter((x) => x < 6).length / medias.length) * 100) : 0 };
        })
        .sort((a, b) => b.percentual - a.percentual);

      const skills = await mapaHabilidades(tx);
      const gente = await nomes(tx, [...alertas.map((a) => a.studentId), ...pedidos.flatMap((p) => [p.tutorId, p.pedidoPor])]);
      const pedidoDoAlerta = new Map(pedidos.map((p) => [p.alertId, p]));
      const situacao = (alertaId: string, status: string) => {
        const p = pedidoDoAlerta.get(alertaId);
        if (status === "ABERTO" || !p) return "Aguardando decisão";
        return p.status === "AGUARDANDO_RESPONSAVEL" ? "Aguardando família" : p.status === "APROVADO" ? "Reforço aprovado" : "Em reforço";
      };

      // Notificações: o que aconteceu na escola nos últimos 14 dias.
      const desde = new Date(agora.getTime() - 14 * DIA);
      const mensagens = await tx.message.findMany({ where: { createdAt: { gte: desde } }, orderBy: { createdAt: "desc" }, take: 10 });
      const genteMsg = await nomes(tx, mensagens.flatMap((m) => [m.fromUserId, m.studentId]));
      const notificacoes = [
        ...alertas.filter((a) => a.createdAt >= desde).map((a) => ({ tipo: "alerta", texto: `${a.frase} (${turmaDe.get(a.studentId)?.nome ?? ""})`, em: a.createdAt })),
        ...pedidos.filter((p) => p.createdAt >= desde).map((p) => ({ tipo: "reforco", texto: `${gente.get(p.pedidoPor)?.nome} indicou ${gente.get(p.tutorId)?.nome} para o reforço`, em: p.createdAt })),
        ...pedidos.filter((p) => p.aprovadoEm && p.aprovadoEm >= desde && p.status !== "RECUSADO").map((p) => ({ tipo: "aprovado", texto: `Família aprovou o reforço com ${gente.get(p.tutorId)?.nome}`, em: p.aprovadoEm! })),
        ...mensagens.map((m) => ({ tipo: "mensagem", texto: `${genteMsg.get(m.fromUserId)?.nome} escreveu sobre ${genteMsg.get(m.studentId)?.nome}`, em: m.createdAt })),
      ]
        .sort((a, b) => b.em.getTime() - a.em.getTime())
        .slice(0, 6);

      await registrarAcesso(tx, s, "visao_geral");
      return {
        escola: s.escola.nome,
        bimestre: bim,
        indicadores: {
          alunos: matriculas.length,
          emRisco: new Set(alertas.map((a) => a.studentId)).size,
          intervencoes: ativos.length,
          taxaRecuperacao: atendidos ? Math.round((fechados / atendidos) * 100) : null,
          mediaGeral: mediaAtual,
          mediaAnterior,
          turmas: turmas.length,
        },
        evolucao,
        riscoPorMateria,
        alunosComAlerta: alertas.slice(0, 8).map((a) => ({
          id: a.id,
          aluno: gente.get(a.studentId)?.nome ?? "",
          turma: turmaDe.get(a.studentId)?.nome ?? "",
          habilidade: skills.get(a.skillId)?.nomeCurto ?? "",
          materia: skills.get(a.skillId)?.materia.nome ?? "",
          score: a.score,
          nivel: nivel(a.score),
          situacao: situacao(a.id, a.status),
        })),
        notificacoes,
      };
    });
  }

  /** Todos os alertas da escola, com os professores de reforço para indicar (sugeridos e todos). */
  @Get("alertas")
  @Papeis("DIRETOR", "COORDENADOR", "ADMIN")
  alertas(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, async (tx) => {
      const alertas = await tx.alert.findMany({ where: { status: { in: ["ABERTO", "ENCAMINHADO"] } }, orderBy: [{ status: "asc" }, { score: "desc" }] });
      const matriculas = await tx.enrollment.findMany({ include: { turma: true } });
      const turmaDe = new Map(matriculas.map((m) => [m.studentId, m.turma.nome]));
      const skills = await mapaHabilidades(tx);
      const pedidos = await tx.tutoringRequest.findMany({ where: { alertId: { in: alertas.map((a) => a.id) } }, orderBy: { createdAt: "desc" } });
      const perfis = await tx.tutorProfile.findMany();
      const gente = await nomes(tx, [...alertas.map((a) => a.studentId), ...perfis.map((p) => p.userId)]);
      const carga = new Map<string, number>();
      for (const p of await tx.tutoringRequest.findMany({ where: { status: { in: ["AGUARDANDO_RESPONSAVEL", "APROVADO", "EM_ANDAMENTO"] } } })) carga.set(p.tutorId, (carga.get(p.tutorId) ?? 0) + 1);
      const porCodigo = new Map([...skills.values()].map((k) => [k.codigo, k.nomeCurto]));

      const sugestoes = new Map<string, Awaited<ReturnType<typeof sugestoesDeReforco>>>();
      for (const k of new Set(alertas.map((a) => a.skillId))) sugestoes.set(k, await sugestoesDeReforco(tx, k));

      await registrarAcesso(tx, s, "alertas_escola");
      return {
        tutores: perfis.map((p) => {
          const h = Object.values((p.historico ?? {}) as Tutor["history"]);
          const c = h.reduce((x, y) => x + y.closed, 0), t = h.reduce((x, y) => x + y.total, 0);
          return { id: p.userId, nome: gente.get(p.userId)?.nome ?? "", especialidades: p.especialidades.map((e) => porCodigo.get(e) ?? e), horarios: p.horarios, modo: p.modo, carga: carga.get(p.userId) ?? 0, taxa: t ? Math.round((c / t) * 100) : null };
        }),
        alertas: alertas.map((a) => {
          const m = a.motivos as unknown as { reasons: AlertReason[]; mastery: number };
          const k = skills.get(a.skillId)!;
          const pedido = pedidos.find((p) => p.alertId === a.id);
          return {
            id: a.id,
            aluno: gente.get(a.studentId)?.nome ?? "",
            turma: turmaDe.get(a.studentId) ?? "",
            habilidade: { nome: k.nomeCurto, codigo: k.codigo, materia: k.materia.nome },
            frase: a.frase,
            score: a.score,
            nivel: nivel(a.score),
            dominio: m.mastery,
            motivos: m.reasons,
            status: a.status,
            pedido: pedido && { status: pedido.status, tutor: gente.get(pedido.tutorId)?.nome },
            sugeridos: (sugestoes.get(a.skillId) ?? []).map((x) => ({ id: x.id, score: x.score, motivos: x.motivos })),
            criadoEm: a.createdAt,
          };
        }),
      };
    });
  }

  @Get("turmas")
  @Papeis("DIRETOR", "COORDENADOR", "ADMIN")
  turmas(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, async (tx) => {
      const turmas = await tx.schoolClass.findMany({ orderBy: { nome: "asc" } });
      const matriculas = await tx.enrollment.findMany();
      const atribuicoes = await tx.classSubject.findMany({ include: { materia: true } });
      const gente = await nomes(tx, atribuicoes.map((a) => a.teacherId));
      const alertas = await tx.alert.findMany({ where: { status: { in: ["ABERTO", "ENCAMINHADO"] } } });
      const ns = await notas(tx);
      const bim = bimestre(new Date());
      const freq = await frequencia(tx, matriculas.map((m) => m.studentId));
      return turmas.map((t) => {
        const alunos = matriculas.filter((m) => m.classId === t.id).map((m) => m.studentId);
        const set = new Set(alunos);
        return {
          id: t.id,
          nome: t.nome,
          serie: t.serie,
          turno: t.turno,
          alunos: alunos.length,
          media: r1(media(ns.filter((n) => n.classId === t.id && bimestre(n.data) === bim).flatMap((n) => [...n.notas.values()]))),
          frequencia: alunos.length ? Math.round((media(alunos.map((a) => freq.get(a) ?? 1))! * 100)) : null,
          comAlerta: new Set(alertas.filter((a) => set.has(a.studentId)).map((a) => a.studentId)).size,
          professores: atribuicoes.filter((a) => a.classId === t.id).map((a) => ({ materia: a.materia.nome, nome: gente.get(a.teacherId)?.nome })),
        };
      });
    });
  }

  @Get("turmas/:id")
  @Papeis("DIRETOR", "COORDENADOR", "ADMIN")
  turma(@Usuario() s: Sessao, @Param("id", ParseUUIDPipe) id: string) {
    return naEscola(this.prisma, s, async (tx) => {
      const t = await tx.schoolClass.findUnique({ where: { id } });
      if (!t) throw new NotFoundException({ erro: "Turma não encontrada" });
      const alunos = (await tx.enrollment.findMany({ where: { classId: id } })).map((m) => m.studentId);
      const gente = await nomes(tx, alunos);
      const ns = (await notas(tx)).filter((n) => n.classId === id);
      const bim = bimestre(new Date());
      const freq = await frequencia(tx, alunos);
      const alertas = await tx.alert.findMany({ where: { studentId: { in: alunos }, status: { in: ["ABERTO", "ENCAMINHADO"] } } });
      const materias = [...new Set(ns.map((n) => n.materia))];
      await registrarAcesso(tx, s, "turma_detalhe", alunos);
      return {
        turma: { id: t.id, nome: t.nome, serie: t.serie, turno: t.turno },
        materias,
        alunos: alunos
          .map((a) => ({
            id: a,
            nome: gente.get(a)?.nome ?? "",
            frequencia: Math.round((freq.get(a) ?? 1) * 100),
            alertas: alertas.filter((x) => x.studentId === a).length,
            notas: Object.fromEntries(materias.map((m) => [m, r1(media(ns.filter((n) => n.materia === m && bimestre(n.data) === bim).flatMap((n) => (n.notas.has(a) ? [n.notas.get(a)!] : []))))])),
          }))
          .sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR")),
      };
    });
  }

  /** Professores e professores de reforço, com carga e resultados. */
  @Get("equipe")
  @Papeis("DIRETOR", "COORDENADOR", "ADMIN")
  equipe(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, async (tx) => {
      const atribuicoes = await tx.classSubject.findMany({ include: { materia: true, turma: true } });
      const perfis = await tx.tutorProfile.findMany();
      const gente = await nomes(tx, [...atribuicoes.map((a) => a.teacherId), ...perfis.map((p) => p.userId)]);
      const ns = await notas(tx);
      const agora = new Date();
      const skills = await mapaHabilidades(tx);
      const porCodigo = new Map([...skills.values()].map((k) => [k.codigo, k.nomeCurto]));
      const ativos = await tx.tutoringRequest.findMany({ where: { status: { in: ["AGUARDANDO_RESPONSAVEL", "APROVADO", "EM_ANDAMENTO"] } } });
      const profs = [...new Set(atribuicoes.map((a) => a.teacherId))];
      return {
        professores: profs
          .map((id) => {
            const minhas = ns.filter((n) => n.teacherId === id && n.data <= agora);
            const ultima = minhas.at(-1)?.data ?? null;
            return {
              id,
              nome: gente.get(id)?.nome ?? "",
              materias: [...new Set(atribuicoes.filter((a) => a.teacherId === id).map((a) => a.materia.nome))],
              turmas: atribuicoes.filter((a) => a.teacherId === id).map((a) => a.turma.nome),
              ultimaAtividade: ultima,
              diasSemAtividade: ultima ? Math.floor((agora.getTime() - ultima.getTime()) / DIA) : null,
            };
          })
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
        reforco: perfis.map((p) => {
          const h = Object.values((p.historico ?? {}) as Tutor["history"]);
          const c = h.reduce((x, y) => x + y.closed, 0), t = h.reduce((x, y) => x + y.total, 0);
          return { id: p.userId, nome: gente.get(p.userId)?.nome ?? "", especialidades: p.especialidades.map((e) => porCodigo.get(e) ?? e), horarios: p.horarios, modo: p.modo, alunosAtivos: ativos.filter((x) => x.tutorId === p.userId).length, atendidos: t, taxa: t ? Math.round((c / t) * 100) : null };
        }),
      };
    });
  }

  /** Todos os reforços da escola, do pedido à conclusão. */
  @Get("reforcos")
  @Papeis("DIRETOR", "COORDENADOR", "ADMIN")
  reforcos(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, async (tx) => {
      const pedidos = await tx.tutoringRequest.findMany({ include: { alerta: true, sessoes: true }, orderBy: { createdAt: "desc" } });
      const gente = await nomes(tx, pedidos.flatMap((p) => [p.alerta.studentId, p.tutorId, p.pedidoPor]));
      const matriculas = await tx.enrollment.findMany({ include: { turma: true } });
      const turmaDe = new Map(matriculas.map((m) => [m.studentId, m.turma.nome]));
      const skills = await mapaHabilidades(tx);
      return pedidos.map((p) => ({
        id: p.id,
        aluno: gente.get(p.alerta.studentId)?.nome ?? "",
        turma: turmaDe.get(p.alerta.studentId) ?? "",
        habilidade: skills.get(p.alerta.skillId)?.nomeCurto,
        tutor: gente.get(p.tutorId)?.nome,
        indicadoPor: gente.get(p.pedidoPor)?.nome,
        status: p.status,
        sessoes: p.sessoes.length,
        realizadas: p.sessoes.filter((x) => x.registro).length,
        planejadas: (p.plano as { sessoes?: number }).sessoes ?? null,
        criadoEm: p.createdAt,
      }));
    });
  }
}

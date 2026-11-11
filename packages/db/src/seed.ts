/**
 * Seed da escola de demonstração. Roda com o superusuário (ignora RLS) e é idempotente:
 * apaga as escolas de demonstração e recria tudo.
 *
 *   pnpm --filter @escola/db seed
 */
import { demo } from "@escola/domain";
import { rodarDetector, type Papel, type PrismaClient, type Tx } from "./index";

/** Data de referência da demonstração: o dia em que os alertas foram gerados. */
const HOJE = new Date("2026-11-11T12:00:00Z");
let prisma: PrismaClient;
const dia = (iso: string) => new Date(`${iso}T00:00:00Z`);

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".");

/** Pessoas com login no Keycloak (mesmo e-mail do realm). */
const COM_LOGIN = {
  marta: { nome: "Marta Ribeiro", papeis: ["PROFESSOR"] },
  jorge: { nome: "Jorge Tavares", papeis: ["PROFESSOR"] },
  renato: { nome: "Renato Siqueira", papeis: ["PROFESSOR_REFORCO"] },
  luiza: { nome: "Luíza Carvalho", papeis: ["PROFESSOR_REFORCO"] },
  beatriz: { nome: "Beatriz Lemos", papeis: ["COORDENADOR"] },
  admin: { nome: "Admin Escola", papeis: ["ADMIN", "COORDENADOR"] },
  helena: { nome: "Helena Gomes", papeis: ["RESPONSAVEL"] },
} satisfies Record<string, { nome: string; papeis: Papel[] }>;

const OUTRAS_MATERIAS = [
  { nome: "Português", codigo: "EF67LP28", curto: "leitura", professor: "Cecília Prado", desc: "Ler, de forma autônoma, e compreender textos literários de diferentes gêneros." },
  { nome: "Ciências", codigo: "EF06CI01", curto: "misturas", professor: "André Nunes", desc: "Classificar como homogênea ou heterogênea a mistura de dois ou mais materiais." },
  { nome: "História", codigo: "EF06HI01", curto: "tempo histórico", professor: "Rita Moraes", desc: "Identificar diferentes formas de compreensão da noção de tempo e de periodização." },
  { nome: "Geografia", codigo: "EF06GE01", curto: "paisagens", professor: "Caio Freitas", desc: "Comparar modificações das paisagens nos lugares de vivência." },
];

async function limpar() {
  const escolas = await prisma.school.findMany({ where: { slug: { in: ["demo", "horizonte"] } } });
  const ids = escolas.map((e) => e.id);
  if (ids.length === 0) return;
  const where = { schoolId: { in: ids } };
  await prisma.tutoringSession.deleteMany({ where });
  await prisma.tutoringRequest.deleteMany({ where });
  await prisma.alert.deleteMany({ where });
  await prisma.mastery.deleteMany({ where });
  await prisma.answer.deleteMany({ where });
  await prisma.message.deleteMany({ where });
  await prisma.attendance.deleteMany({ where });
  await prisma.tutorProfile.deleteMany({ where });
  await prisma.guardianLink.deleteMany({ where });
  await prisma.accessLog.deleteMany({ where });
  await prisma.school.deleteMany({ where: { id: { in: ids } } }); // cascata: turmas, matérias, provas, vínculos
  // Quem ficou sem vínculo com nenhuma escola (ex.: alunos importados em testes) sai do cadastro global.
  await prisma.user.deleteMany({ where: { vinculos: { none: {} } } });
}

async function usuario(email: string, nome: string, dataNascimento?: string) {
  return prisma.user.upsert({
    where: { email },
    create: { email, nome, dataNascimento: dataNascimento ? dia(dataNascimento) : null },
    update: { nome, dataNascimento: dataNascimento ? dia(dataNascimento) : null },
  });
}

/** Recria a escola de demonstração do zero. Precisa de uma conexão de superusuário (ignora o RLS). */
export async function semear(cliente: PrismaClient) {
  prisma = cliente;
  await limpar();
  const escola = await prisma.school.create({ data: { nome: demo.DEMO_SCHOOL.name, slug: "demo" } });
  const S = escola.id;

  // Pessoas
  const pessoa: Record<string, string> = {};
  for (const [login, p] of Object.entries(COM_LOGIN)) {
    const u = await usuario(`${login}@trilha.local`, p.nome);
    pessoa[login] = u.id;
    await prisma.membership.create({ data: { schoolId: S, userId: u.id, papeis: p.papeis } });
  }
  const semLogin = async (nome: string, papeis: Papel[]) => {
    const u = await usuario(`${slug(nome)}@equipe.trilha.local`, nome);
    await prisma.membership.create({ data: { schoolId: S, userId: u.id, papeis } });
    return u.id;
  };
  for (const t of demo.TUTORS) {
    const login = Object.entries(COM_LOGIN).find(([, p]) => p.nome === t.name)?.[0];
    pessoa[t.id] = login ? pessoa[login]! : await semLogin(t.name, ["PROFESSOR_REFORCO"]);
    await prisma.tutorProfile.create({
      data: { schoolId: S, userId: pessoa[t.id]!, especialidades: t.specialties, horarios: t.slots, modo: t.mode, historico: t.history },
    });
  }

  // Turmas e alunos
  const turma: Record<string, string> = {};
  for (const c of demo.CLASSES) {
    const t = await prisma.schoolClass.create({
      data: { schoolId: S, nome: c.name, serie: c.grade, anoLetivo: c.year, turno: c.shift === "manhã" ? "MANHA" : "TARDE" },
    });
    turma[c.id] = t.id;
  }
  const aluno: Record<string, string> = {};
  for (const s of demo.STUDENTS) {
    const ehJoao = s.id === demo.GUARDIAN.childId;
    const nome = ehJoao ? "João Gomes" : s.name;
    const u = await usuario(ehJoao ? "joao@trilha.local" : `${slug(nome)}.${s.id}@alunos.trilha.local`, nome, s.birthDate);
    aluno[s.id] = u.id;
    await prisma.membership.create({ data: { schoolId: S, userId: u.id, papeis: ["ALUNO"] } });
    await prisma.enrollment.create({ data: { schoolId: S, classId: turma[s.classId]!, studentId: u.id } });
  }
  await prisma.guardianLink.create({ data: { schoolId: S, guardianId: pessoa.helena!, studentId: aluno[demo.GUARDIAN.childId]! } });

  // Matérias, habilidades e atribuições
  const mat = await prisma.subject.create({ data: { schoolId: S, nome: "Matemática" } });
  const skill: Record<string, string> = {};
  for (const k of demo.SKILLS) {
    const r = await prisma.skill.create({ data: { schoolId: S, subjectId: mat.id, codigo: k.code, descricao: k.description, nomeCurto: k.shortName } });
    skill[k.code] = r.id;
  }
  const csMat: Record<string, string> = {};
  for (const c of demo.CLASSES) {
    const prof = ["6a", "6b"].includes(c.id) ? pessoa.marta! : pessoa.jorge!;
    csMat[c.id] = (await prisma.classSubject.create({ data: { schoolId: S, classId: turma[c.id]!, subjectId: mat.id, teacherId: prof } })).id;
  }

  // Atividades de Matemática: 5 questões por habilidade, respostas questão por questão.
  for (const c of demo.CLASSES) {
    for (const date of [...new Set(Object.values(demo.EVIDENCE)[0]!.map((e) => e.date))]) {
      const questoes = demo.SKILLS.flatMap((k, i) =>
        Array.from({ length: 5 }, (_, j) => ({ schoolId: S, numero: i * 5 + j + 1, enunciado: `${k.shortName}: item ${j + 1}`, alternativas: ["A", "B", "C", "D"], gabarito: 0, skillId: skill[k.code]! })),
      );
      const av = await prisma.assessment.create({
        data: { schoolId: S, classSubjectId: csMat[c.id]!, titulo: `Atividade de ${date.slice(8, 10)}/${date.slice(5, 7)}`, data: dia(date), tipo: "TAREFA", questoes: { create: questoes } },
        include: { questoes: true },
      });
      const respostas = demo.studentsOfClass(c.id).flatMap((s) =>
        demo.EVIDENCE[s.id]!.filter((e) => e.date === date).flatMap((e) =>
          av.questoes.filter((q) => q.skillId === skill[e.skill]).map((q, j) => ({ schoolId: S, questionId: q.id, studentId: aluno[s.id]!, marcada: j < e.correct ? 0 : 1 + (j % 3) })),
        ),
      );
      await prisma.answer.createMany({ data: respostas });
    }
  }

  // Prova do 4º bimestre do 6º B, com distratores.
  const prova = await prisma.assessment.create({
    data: {
      schoolId: S, classSubjectId: csMat["6b"]!, titulo: demo.ASSESSMENT.title, data: dia(demo.ASSESSMENT.date), tipo: "PROVA",
      questoes: {
        create: demo.ASSESSMENT.questions.map((q) => ({
          schoolId: S, numero: q.number, enunciado: q.statement, alternativas: q.options, gabarito: q.correct, skillId: skill[q.skill]!, distratores: q.distractors ?? {},
        })),
      },
    },
    include: { questoes: true },
  });
  const porNumero = new Map(prova.questoes.map((q) => [`q${q.numero}`, q.id]));
  await prisma.answer.createMany({
    data: demo.ANSWERS.map((a) => ({ schoolId: S, questionId: porNumero.get(a.questionId)!, studentId: aluno[a.studentId]!, marcada: a.chosen, tempoSeg: a.timeSeconds })),
  });

  // Listas recentes: quem tem tarefas pendentes nos sinais da demo não entregou.
  for (const c of demo.CLASSES) {
    for (const [n, date] of [[5, "2026-11-02"], [6, "2026-11-09"]] as const) {
      const av = await prisma.assessment.create({
        data: {
          schoolId: S, classSubjectId: csMat[c.id]!, titulo: `Lista ${n}`, data: dia(date), tipo: "TAREFA",
          questoes: { create: [1, 2, 3].map((i) => ({ schoolId: S, numero: i, enunciado: `Lista ${n}, item ${i}`, alternativas: ["A", "B", "C", "D"], gabarito: 0, skillId: skill.EF06MA03! })) },
        },
        include: { questoes: true },
      });
      const respostas = demo.SIGNALS.filter((s) => s.studentId.startsWith(`${c.id}-`) && s.missingTasks < (n === 6 ? 1 : 2)).flatMap((s) => {
          // Acerto com a mesma chance do domínio do aluno em problemas com naturais.
          const r = rng(hash(s.studentId + n));
          return av.questoes.map((q) => ({ schoolId: S, questionId: q.id, studentId: aluno[s.studentId]!, marcada: r() * 100 < (demo.MASTERY[s.studentId]?.EF06MA03 ?? 60) ? 0 : 2 }));
        }
      );
      await prisma.answer.createMany({ data: respostas });
    }
  }

  // Outras matérias: prova do 3º e do 4º bimestre, com médias por turma.
  for (const m of OUTRAS_MATERIAS) {
    const subj = await prisma.subject.create({ data: { schoolId: S, nome: m.nome } });
    const sk = await prisma.skill.create({ data: { schoolId: S, subjectId: subj.id, codigo: m.codigo, descricao: m.desc, nomeCurto: m.curto } });
    const prof = await semLogin(m.professor, ["PROFESSOR"]);
    for (const c of demo.CLASSES) {
      const cs = await prisma.classSubject.create({ data: { schoolId: S, classId: turma[c.id]!, subjectId: subj.id, teacherId: prof } });
      const alvo = demo.CLASS_SUBJECT_AVG.find((x) => x.classId === c.id && x.subject === m.nome)!;
      for (const [titulo, date, media] of [["Prova do 3º bimestre", "2026-09-25", alvo.prev], ["Prova do 4º bimestre", "2026-11-05", alvo.avg]] as const) {
        const av = await prisma.assessment.create({
          data: {
            schoolId: S, classSubjectId: cs.id, titulo, data: dia(date), tipo: "PROVA",
            questoes: { create: Array.from({ length: 10 }, (_, i) => ({ schoolId: S, numero: i + 1, enunciado: `${m.curto}: questão ${i + 1}`, alternativas: ["A", "B", "C", "D"], gabarito: 0, skillId: sk.id })) },
          },
          include: { questoes: true },
        });
        const r = rng(hash(c.id + m.nome + date));
        const respostas = demo.studentsOfClass(c.id).flatMap((s) => {
          const acertos = Math.max(0, Math.min(10, Math.round(media + (r() - 0.5) * 4)));
          return av.questoes.map((q, i) => ({ schoolId: S, questionId: q.id, studentId: aluno[s.id]!, marcada: i < acertos ? 0 : 1 }));
        });
        await prisma.answer.createMany({ data: respostas });
      }
    }
  }

  // Frequência diária (dias úteis de 28/09 a 10/11).
  const presencas: { schoolId: string; classId: string; studentId: string; data: Date; presente: boolean }[] = [];
  for (let d = dia("2026-09-28"); d <= dia("2026-11-10"); d = new Date(d.getTime() + 86_400_000)) {
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
    for (const sig of demo.SIGNALS) {
      const r = rng(hash(sig.studentId + d.toISOString()));
      const s = demo.studentById(sig.studentId)!;
      presencas.push({ schoolId: S, classId: turma[s.classId]!, studentId: aluno[s.id]!, data: d, presente: r() < sig.attendance });
    }
  }
  await prisma.attendance.createMany({ data: presencas });

  // Detector e reforços já em andamento.
  const resumo = await prisma.$transaction((tx) => rodarDetector(tx as Tx, S, { hoje: HOJE }), { timeout: 120_000 });
  for (const [sid, inicio] of [["6a-12", "2026-11-11T14:00:00-03:00"], ["6d-09", "2026-11-13T15:00:00-03:00"]] as const) {
    const alerta = await prisma.alert.findFirst({ where: { studentId: aluno[sid]!, status: "ABERTO" }, orderBy: { score: "desc" } });
    if (!alerta) continue;
    const tutor = pessoa["t-renato"]!; // especialista em frações e decimais
    await prisma.alert.update({ where: { id: alerta.id }, data: { status: "ENCAMINHADO" } });
    await prisma.tutoringRequest.create({
      data: {
        schoolId: S, alertId: alerta.id, tutorId: tutor, pedidoPor: sid.startsWith("6a") ? pessoa.marta! : pessoa.jorge!,
        plano: { sessoes: 4 }, status: "EM_ANDAMENTO", aprovadoEm: dia("2026-11-05"),
        sessoes: { create: [{ schoolId: S, inicio: new Date(inicio), modo: sid === "6d-09" ? "online" : "presencial" }] },
      },
    });
  }

  // Segunda escola: existe só para provar o isolamento.
  const outra = await prisma.school.create({ data: { nome: "Colégio Horizonte", slug: "horizonte" } });
  const carla = await usuario("carla@horizonte.trilha.local", "Carla Mendes");
  await prisma.membership.create({ data: { schoolId: outra.id, userId: carla.id, papeis: ["PROFESSOR"] } });
  const t7 = await prisma.schoolClass.create({ data: { schoolId: outra.id, nome: "7º ano A", serie: "7º ano", anoLetivo: 2026, turno: "MANHA" } });
  const bia = await usuario("bia@alunos.horizonte.trilha.local", "Bia Horizonte", "2013-05-02");
  await prisma.membership.create({ data: { schoolId: outra.id, userId: bia.id, papeis: ["ALUNO"] } });
  await prisma.enrollment.create({ data: { schoolId: outra.id, classId: t7.id, studentId: bia.id } });

  return { escola: escola.slug, alunos: demo.STUDENTS.length, detector: resumo };
}

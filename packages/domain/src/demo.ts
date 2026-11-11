/**
 * Escola de demonstração. Dados fictícios, gerados de forma determinística
 * e processados pelas mesmas funções do produto real (correção, domínio, detector).
 * Toda tela que usa estes dados mostra o selo "Escola de demonstração".
 */
import { evaluateStudent, summarizeAlerts, type RiskAlert, type StudentSignals } from "./detector";
import { gradeAssessment, type AssessmentReport } from "./grading";
import { computeMastery, type SkillEvidence } from "./mastery";
import type { Assessment, Question, SchoolClass, Skill, Student, StudentAnswer, Tutor } from "./types";

export const DEMO_SCHOOL = { id: "demo", name: "Escola de demonstração", city: "Belo Horizonte" };
export const DEMO_TODAY = "2026-11-11";

/** PRNG determinístico (mulberry32): a demo é sempre igual. */
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

export const SKILLS: Skill[] = [
  { code: "EF06MA03", shortName: "problemas com naturais", subject: "Matemática", description: "Resolver e elaborar problemas que envolvam cálculos com números naturais." },
  { code: "EF06MA07", shortName: "frações", subject: "Matemática", description: "Compreender, comparar e ordenar frações associadas às ideias de partes de inteiros." },
  { code: "EF06MA08", shortName: "decimais", subject: "Matemática", description: "Reconhecer que os números racionais positivos podem ser expressos nas formas fracionária e decimal." },
  { code: "EF06MA13", shortName: "porcentagem", subject: "Matemática", description: "Resolver e elaborar problemas que envolvam porcentagens." },
  { code: "EF06MA19", shortName: "triângulos", subject: "Matemática", description: "Identificar características dos triângulos e classificá-los." },
  { code: "EF06MA24", shortName: "medidas", subject: "Matemática", description: "Resolver e elaborar problemas que envolvam grandezas como comprimento, massa e capacidade." },
];

export const CLASSES: SchoolClass[] = ["A", "B", "C", "D"].map((l, i) => ({
  id: `6${l.toLowerCase()}`,
  name: `6º ano ${l}`,
  grade: "6º ano",
  shift: i < 2 ? "manhã" : "tarde",
  year: 2026,
}));

const FIRST = ["Ana", "Bruno", "Clara", "Davi", "Elisa", "Felipe", "Gabriela", "Heitor", "Isabela", "João", "Laura", "Lucas", "Manuela", "Miguel", "Nina", "Otávio", "Pedro", "Rafaela", "Samuel", "Sofia", "Theo", "Valentina", "Vitor", "Yasmin"];
const LAST = ["Almeida", "Barbosa", "Cardoso", "Dias", "Esteves", "Ferreira", "Gomes", "Lima", "Martins", "Nogueira", "Oliveira", "Pereira", "Queiroz", "Ribeiro", "Santos", "Teixeira"];

export const STUDENTS: Student[] = CLASSES.flatMap((c, ci) => {
  const r = rng(100 + ci);
  return FIRST.map((f, i) => ({
    id: `${c.id}-${String(i + 1).padStart(2, "0")}`,
    name: `${f} ${LAST[Math.floor(r() * LAST.length)]}`,
    classId: c.id,
    birthDate: `2014-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-${String(1 + Math.floor(r() * 28)).padStart(2, "0")}`,
  }));
});

export const firstName = (s: Student) => s.name.split(" ")[0]!;

/** Alunos do 6º B com queda recente: geram os alertas da demo. */
const DECLINING: Record<string, string[]> = {
  "6b-10": ["EF06MA07"], // João
  "6b-03": ["EF06MA07"], // Clara
  "6b-16": ["EF06MA07", "EF06MA08"], // Otávio
  "6b-22": ["EF06MA07"], // Valentina
  "6b-07": ["EF06MA13"], // Gabriela
  "6a-12": ["EF06MA07"],
  "6c-05": ["EF06MA13"],
  "6c-18": ["EF06MA07"],
  "6c-02": ["EF06MA07"],
  "6d-09": ["EF06MA08"],
};

const CLASS_LEVEL: Record<string, number> = { "6a": 0.74, "6b": 0.66, "6c": 0.6, "6d": 0.7 };
const ACTIVITY_DATES = ["2026-09-08", "2026-09-22", "2026-10-06", "2026-10-20", "2026-10-30", "2026-11-06"];

function buildEvidence(student: Student): SkillEvidence[] {
  const r = rng(hash(student.id));
  const base = CLASS_LEVEL[student.classId] ?? 0.65;
  const declining = DECLINING[student.id] ?? [];
  const out: SkillEvidence[] = [];
  for (const skill of SKILLS) {
    const ability = clamp(base + (r() - 0.5) * 0.4 + skillDifficulty(skill.code), 0.25, 0.97);
    ACTIVITY_DATES.forEach((date, i) => {
      let p = ability + (r() - 0.5) * 0.12;
      if (declining.includes(skill.code)) p = i < 3 ? Math.max(p, 0.7 + r() * 0.12) : 0.66 - (i - 3) * (0.12 + r() * 0.06) + (r() - 0.5) * 0.08;
      const total = 5;
      out.push({ date, skill: skill.code, total, correct: Math.round(clamp(p, 0, 1) * total) });
    });
  }
  return out;
}

function skillDifficulty(code: string) {
  return code === "EF06MA07" ? -0.08 : code === "EF06MA13" ? -0.04 : 0.03;
}
function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

export const EVIDENCE: Record<string, SkillEvidence[]> = Object.fromEntries(
  STUDENTS.map((s) => [s.id, buildEvidence(s)]),
);

export const SIGNALS: StudentSignals[] = STUDENTS.map((s) => {
  const r = rng(hash(s.id) + 7);
  const declining = s.id in DECLINING;
  return {
    studentId: s.id,
    firstName: firstName(s),
    evidence: EVIDENCE[s.id]!,
    attendance: declining ? 0.78 + r() * 0.06 : 0.88 + r() * 0.12,
    missingTasks: declining ? 1 + Math.floor(r() * 2) : r() < 0.15 ? 1 : 0,
  };
});

export const MASTERY: Record<string, Record<string, number>> = Object.fromEntries(
  STUDENTS.map((s) => [s.id, computeMastery(EVIDENCE[s.id]!)]),
);

export const ALERTS: RiskAlert[] = SIGNALS.flatMap((sig) => evaluateStudent(sig, SKILLS));

export const alertsForClass = (classId: string) =>
  ALERTS.filter((a) => a.studentId.startsWith(`${classId}-`));

export const studentById = (id: string) => STUDENTS.find((s) => s.id === id);
export const skillByCode = (code: string) => SKILLS.find((s) => s.code === code);
export const classById = (id: string) => CLASSES.find((c) => c.id === id);
export const studentsOfClass = (classId: string) => STUDENTS.filter((s) => s.classId === classId);

/* ---------- Prova bimestral do 6º B ---------- */

const Q = (number: number, skill: string, statement: string, options: string[], correct: number, distractors?: Record<number, string>): Question => ({
  id: `q${number}`, number, skill, statement, options, correct, distractors,
});

export const ASSESSMENT: Assessment = {
  id: "av-6b-4bim",
  title: "Avaliação do 4º bimestre — Frações, decimais e porcentagem",
  date: "2026-11-06",
  classId: "6b",
  subject: "Matemática",
  questions: [
    Q(1, "EF06MA07", "Qual fração representa a parte pintada de uma pizza dividida em 8 pedaços, com 3 pintados?", ["3/8", "8/3", "3/5", "5/8"], 0, { 1: "inverte numerador e denominador", 3: "conta a parte não pintada" }),
    Q(2, "EF06MA07", "Qual é maior: 2/3 ou 3/5?", ["3/5", "2/3", "São iguais", "Não dá para comparar"], 1, { 0: "compara só os numeradores" }),
    Q(3, "EF06MA08", "Como se escreve 3/4 na forma decimal?", ["0,34", "0,75", "3,4", "0,43"], 1, { 0: "junta numerador e denominador como dígitos" }),
    Q(4, "EF06MA07", "Quanto é 1/2 + 1/4?", ["2/6", "1/6", "3/4", "2/4"], 2, { 0: "soma numeradores e denominadores" }),
    Q(5, "EF06MA13", "Quanto é 25% de 80?", ["25", "20", "40", "55"], 1, { 0: "confunde a porcentagem com o resultado" }),
    Q(6, "EF06MA08", "Ordene: 0,5 — 0,45 — 0,405", ["0,405 < 0,45 < 0,5", "0,5 < 0,45 < 0,405", "0,405 ≤ 0,45 ≤ 0,5", "0,405 < 0,5 < 0,45"], 0, { 1: "acha que mais casas decimais é maior", 2: "enunciado ambíguo: aceita igualdade" }),
    Q(7, "EF06MA13", "Uma camisa de R$ 60 tem desconto de 10%. Qual o novo preço?", ["R$ 50", "R$ 54", "R$ 6", "R$ 66"], 1, { 2: "calcula o desconto e não subtrai", 3: "soma em vez de subtrair" }),
    Q(8, "EF06MA07", "Qual fração é equivalente a 2/5?", ["4/10", "2/10", "4/5", "5/2"], 0, { 1: "multiplica só o denominador" }),
    Q(9, "EF06MA07", "Quanto é 2/3 de 3/4?", ["5/7", "6/7", "1/2", "8/9"], 2, { 0: "soma numeradores e denominadores", 1: "multiplica os numeradores e soma os denominadores" }),
    Q(10, "EF06MA08", "Quanto é 1,2 + 0,35?", ["1,55", "1,37", "4,7", "0,47"], 0, { 1: "alinha pela direita, não pela vírgula" }),
  ],
};

/** Nível de domínio necessário para acertar cada questão. */
const DIFFICULTY: Record<number, number> = { 1: 45, 2: 55, 3: 50, 4: 60, 5: 50, 7: 58, 8: 50, 9: 70, 10: 45 };

function buildAnswers(): StudentAnswer[] {
  const out: StudentAnswer[] = [];
  for (const s of studentsOfClass("6b")) {
    const r = rng(hash(s.id) + 99);
    const m = MASTERY[s.id]!;
    for (const q of ASSESSMENT.questions) {
      const level = (m[q.skill] ?? 60) + (r() - 0.5) * 16;
      const hard = DIFFICULTY[q.number] ?? 55;
      let chosen: number | null;
      if (q.number === 6) {
        // Questão ambígua: quem vai bem na prova enxerga a igualdade e marca C; o acerto não acompanha o domínio.
        const geral = Object.values(m).reduce((a, b) => a + b, 0) / Object.values(m).length;
        chosen = r() < (geral >= 66 ? 0.25 : 0.75) ? q.correct : 2;
      } else if (r() < 0.03) {
        chosen = null;
      } else if (level > hard) {
        chosen = q.correct;
      } else {
        const wrong = Object.keys(q.distractors ?? {}).map(Number);
        chosen = wrong.length && r() < 0.8 ? wrong[Math.floor(r() * wrong.length)]! : (q.correct + 1 + Math.floor(r() * 3)) % 4;
      }
      out.push({ studentId: s.id, questionId: q.id, chosen, timeSeconds: 40 + Math.floor(r() * 120) });
    }
  }
  return out;
}

export const ANSWERS = buildAnswers();
export const REPORT: AssessmentReport = gradeAssessment(
  ASSESSMENT,
  studentsOfClass("6b").map((s) => s.id),
  ANSWERS,
);

/* ---------- Professores ---------- */

export const TEACHER = { id: "prof-marta", name: "Marta Ribeiro", subject: "Matemática", classes: ["6a", "6b"] };

export const TUTORS: Tutor[] = [
  { id: "t-renato", name: "Renato Siqueira", specialties: ["EF06MA07", "EF06MA08"], slots: ["ter 14:00", "qui 14:00", "qui 15:00"], history: { EF06MA07: { closed: 17, total: 19 }, EF06MA08: { closed: 9, total: 11 } }, mode: "ambos" },
  { id: "t-luiza", name: "Luíza Carvalho", specialties: ["EF06MA07", "EF06MA13"], slots: ["seg 15:00", "qua 15:00"], history: { EF06MA07: { closed: 11, total: 14 }, EF06MA13: { closed: 12, total: 13 } }, mode: "online" },
  { id: "t-paulo", name: "Paulo Menezes", specialties: ["EF06MA03", "EF06MA24"], slots: ["seg 14:00", "ter 14:00", "sex 10:00"], history: { EF06MA03: { closed: 20, total: 22 }, EF06MA07: { closed: 3, total: 6 } }, mode: "presencial" },
  { id: "t-ines", name: "Inês Barros", specialties: ["EF06MA19", "EF06MA13"], slots: ["qua 14:00", "sex 14:00"], history: { EF06MA13: { closed: 8, total: 10 } }, mode: "presencial" },
];

/** Fila do professor de reforço (Renato), já com diagnóstico. */
export const TUTORING_QUEUE = [
  { studentId: "6b-10", skill: "EF06MA07", requestedBy: "Marta Ribeiro", requestedAt: "2026-11-10", status: "aguardando-responsavel" as const },
  { studentId: "6b-16", skill: "EF06MA07", requestedBy: "Marta Ribeiro", requestedAt: "2026-11-10", status: "aprovado" as const },
  { studentId: "6a-12", skill: "EF06MA07", requestedBy: "Marta Ribeiro", requestedAt: "2026-11-06", status: "em-andamento" as const },
  { studentId: "6d-09", skill: "EF06MA08", requestedBy: "Jorge Tavares", requestedAt: "2026-11-04", status: "em-andamento" as const },
];

export const TUTOR_SESSIONS = [
  { day: "ter", date: "2026-11-11", time: "14:00", studentId: "6a-12", skill: "EF06MA07", mode: "presencial", number: 3, of: 4 },
  { day: "qui", date: "2026-11-13", time: "14:00", studentId: "6b-16", skill: "EF06MA07", mode: "presencial", number: 1, of: 4 },
  { day: "qui", date: "2026-11-13", time: "15:00", studentId: "6d-09", skill: "EF06MA08", mode: "online", number: 2, of: 3 },
];

/* ---------- Coordenação ---------- */

function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

const SUBJECTS = ["Matemática", "Português", "Ciências", "História", "Geografia"];

/** Média por turma e matéria, 0 a 10. Matemática vem do domínio real; as outras são fictícias. */
export const CLASS_SUBJECT_AVG: { classId: string; subject: string; avg: number; prev: number }[] =
  CLASSES.flatMap((c) =>
    SUBJECTS.map((subject) => {
      const r = rng(hash(c.id + subject));
      if (subject === "Matemática") {
        const students = studentsOfClass(c.id);
        const avg = students.reduce((s, st) => s + mean(Object.values(MASTERY[st.id]!)), 0) / students.length / 10;
        return { classId: c.id, subject, avg: round1(avg), prev: round1(avg + (c.id === "6c" ? 0.6 : 0.1 + r() * 0.2 - 0.1)) };
      }
      const avg = 6 + r() * 2.4;
      return { classId: c.id, subject, avg: round1(avg), prev: round1(avg + (r() - 0.5) * 0.8) };
    }),
  );

export const TEACHERS_ACTIVITY = [
  { name: "Marta Ribeiro", subject: "Matemática", classes: "6º A, 6º B", lastActivity: "2026-11-07" },
  { name: "Jorge Tavares", subject: "Matemática", classes: "6º C, 6º D", lastActivity: "2026-10-21" },
  { name: "Cecília Prado", subject: "Português", classes: "6º A–D", lastActivity: "2026-11-10" },
  { name: "André Nunes", subject: "Ciências", classes: "6º A–D", lastActivity: "2026-11-05" },
];

/* ---------- Família e aluno ---------- */

/** Responsável da demo: mãe do João (6º B). */
export const GUARDIAN = { id: "resp-helena", name: "Helena", childId: "6b-10" };

export const CLASS_SCHEDULE = [
  { when: "qua 12/11", what: "Aula: multiplicação de frações", where: "Sala 14" },
  { when: "sex 14/11", what: "Entrega: lista 7 de frações", where: "Online" },
  { when: "ter 18/11", what: "Simulado de Matemática", where: "Sala 14" },
];

/** Material das aulas por habilidade: base do plano de reforço e do assistente da aula. */
export const LESSON_MATERIALS: Record<string, { title: string; pages: string; date: string }[]> = {
  EF06MA07: [
    { title: "Aula 21 — Frações equivalentes", pages: "Apostila p. 88–93", date: "2026-10-28" },
    { title: "Aula 22 — Soma de frações", pages: "Apostila p. 94–99", date: "2026-11-04" },
    { title: "Aula 23 — Fração de uma fração", pages: "Apostila p. 100–103", date: "2026-11-05" },
  ],
  EF06MA08: [
    { title: "Aula 17 — Da fração ao decimal", pages: "Apostila p. 70–74", date: "2026-10-07" },
    { title: "Aula 18 — Comparar decimais", pages: "Apostila p. 75–79", date: "2026-10-14" },
    { title: "Aula 19 — Somar e subtrair decimais", pages: "Apostila p. 80–84", date: "2026-10-21" },
  ],
  EF06MA13: [
    { title: "Aula 24 — Porcentagem como fração de 100", pages: "Apostila p. 104–108", date: "2026-11-10" },
  ],
};

export const DEMO_SUMMARY = summarizeAlerts(alertsForClass("6b"), SKILLS);

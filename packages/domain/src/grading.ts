import type { Assessment, Question, SkillCode, StudentAnswer } from "./types";

/**
 * Correção determinística de múltipla escolha.
 * Sem IA: o mesmo gabarito e as mesmas respostas sempre dão o mesmo resultado.
 */

export interface StudentResult {
  studentId: string;
  correct: number;
  total: number;
  /** Nota de 0 a 10, com uma casa decimal. */
  score: number;
  bySkill: Record<SkillCode, { correct: number; total: number }>;
  wrongQuestionIds: string[];
}

export type QuestionFlag = "todos-erram" | "nao-discrimina" | "muitos-em-branco";

export interface QuestionStats {
  questionId: string;
  number: number;
  skill: SkillCode;
  /** Fração de acertos, 0 a 1. */
  pctCorrect: number;
  /** Índice de discriminação (grupo de cima − grupo de baixo), −1 a 1. */
  discrimination: number;
  /** Quantas vezes cada alternativa foi marcada. */
  optionCounts: number[];
  blank: number;
  /** Alternativa errada mais marcada e o que ela revela. */
  topDistractor: { option: number; count: number; meaning?: string } | null;
  flags: QuestionFlag[];
}

export interface AssessmentReport {
  assessmentId: string;
  students: StudentResult[];
  questions: QuestionStats[];
  average: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function gradeStudent(
  assessment: Assessment,
  studentId: string,
  answers: StudentAnswer[],
): StudentResult {
  const mine = new Map(
    answers.filter((a) => a.studentId === studentId).map((a) => [a.questionId, a.chosen]),
  );
  const bySkill: StudentResult["bySkill"] = {};
  const wrong: string[] = [];
  let correct = 0;

  for (const q of assessment.questions) {
    const slot = (bySkill[q.skill] ??= { correct: 0, total: 0 });
    slot.total += 1;
    if (mine.get(q.id) === q.correct) {
      correct += 1;
      slot.correct += 1;
    } else {
      wrong.push(q.id);
    }
  }

  const total = assessment.questions.length;
  return {
    studentId,
    correct,
    total,
    score: total === 0 ? 0 : round1((correct / total) * 10),
    bySkill,
    wrongQuestionIds: wrong,
  };
}

function questionStats(
  q: Question,
  answers: StudentAnswer[],
  upper: Set<string>,
  lower: Set<string>,
): QuestionStats {
  const forQ = answers.filter((a) => a.questionId === q.id);
  const optionCounts = q.options.map(() => 0);
  let blank = 0;
  for (const a of forQ) {
    if (a.chosen === null || a.chosen < 0 || a.chosen >= q.options.length) blank += 1;
    else optionCounts[a.chosen]! += 1;
  }
  const n = forQ.length;
  const pctCorrect = n === 0 ? 0 : (optionCounts[q.correct] ?? 0) / n;

  const rate = (group: Set<string>) => {
    if (group.size === 0) return 0;
    const hits = forQ.filter((a) => group.has(a.studentId) && a.chosen === q.correct).length;
    return hits / group.size;
  };
  const discrimination = round2(rate(upper) - rate(lower));

  let topDistractor: QuestionStats["topDistractor"] = null;
  optionCounts.forEach((count, option) => {
    if (option === q.correct || count === 0) return;
    if (!topDistractor || count > topDistractor.count) {
      topDistractor = { option, count, meaning: q.distractors?.[option] };
    }
  });

  const flags: QuestionFlag[] = [];
  if (n > 0 && pctCorrect < 0.3) flags.push("todos-erram");
  // Questão que quase todos acertam não discrimina por natureza; não é defeito.
  if (n >= 10 && pctCorrect < 0.9 && discrimination < 0.2) flags.push("nao-discrimina");
  if (n > 0 && blank / n > 0.2) flags.push("muitos-em-branco");

  return {
    questionId: q.id,
    number: q.number,
    skill: q.skill,
    pctCorrect: round2(pctCorrect),
    discrimination,
    optionCounts,
    blank,
    topDistractor,
    flags,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Corrige a prova inteira e analisa cada questão. */
export function gradeAssessment(
  assessment: Assessment,
  studentIds: string[],
  answers: StudentAnswer[],
): AssessmentReport {
  const students = studentIds.map((id) => gradeStudent(assessment, id, answers));

  // Grupos de cima e de baixo: 27% dos alunos, método clássico de Kelley.
  const sorted = [...students].sort((a, b) => b.correct - a.correct);
  const k = Math.max(1, Math.round(sorted.length * 0.27));
  const upper = new Set(sorted.slice(0, k).map((s) => s.studentId));
  const lower = new Set(sorted.slice(-k).map((s) => s.studentId));

  const questions = assessment.questions.map((q) => questionStats(q, answers, upper, lower));
  const average =
    students.length === 0 ? 0 : round1(students.reduce((s, r) => s + r.score, 0) / students.length);

  return { assessmentId: assessment.id, students, questions, average };
}

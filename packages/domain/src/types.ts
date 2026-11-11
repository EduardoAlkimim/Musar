/** Tipos do domínio escolar. Sem dependência de banco ou framework. */

export type SkillCode = string; // código BNCC, ex.: "EF06MA07"

export interface Skill {
  code: SkillCode;
  description: string;
  /** Rótulo curto para a tela, ex.: "frações". */
  shortName: string;
  subject: string;
}

export interface Question {
  id: string;
  number: number;
  statement: string;
  options: string[];
  /** Índice da alternativa correta. */
  correct: number;
  skill: SkillCode;
  /** O que cada alternativa errada costuma revelar (índice → confusão). */
  distractors?: Record<number, string>;
}

export interface Assessment {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  classId: string;
  subject: string;
  questions: Question[];
}

export interface StudentAnswer {
  studentId: string;
  questionId: string;
  /** Alternativa marcada; null = em branco. */
  chosen: number | null;
  timeSeconds?: number;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  birthDate: string;
}

export interface SchoolClass {
  id: string;
  name: string; // "6º ano B"
  grade: string;
  shift: "manhã" | "tarde";
  year: number;
}

export interface Tutor {
  id: string;
  name: string;
  specialties: SkillCode[];
  /** Horários livres, ex.: "seg 14:00". */
  slots: string[];
  /** Histórico: alunos que fecharam o reforço / alunos atendidos, por habilidade. */
  history: Record<SkillCode, { closed: number; total: number }>;
  mode: "presencial" | "online" | "ambos";
}

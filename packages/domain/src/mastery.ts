import type { SkillCode } from "./types";

/** Resultado de um aluno numa habilidade, numa atividade (prova, tarefa, simulado). */
export interface SkillEvidence {
  date: string; // ISO
  skill: SkillCode;
  correct: number;
  total: number;
}

/** Peso da atividade mais recente no domínio. 0.4 = reage rápido sem esquecer o histórico. */
const ALPHA = 0.4;

/**
 * Domínio de 0 a 100 por habilidade, recalculado a cada atividade.
 * Média móvel exponencial: a evidência mais nova pesa mais.
 */
export function computeMastery(evidence: SkillEvidence[]): Record<SkillCode, number> {
  const bySkill = groupBySkill(evidence);
  const out: Record<SkillCode, number> = {};
  for (const [skill, items] of Object.entries(bySkill)) {
    let level: number | null = null;
    for (const e of items) {
      const pct = e.total === 0 ? 0 : (e.correct / e.total) * 100;
      level = level === null ? pct : ALPHA * pct + (1 - ALPHA) * level;
    }
    out[skill] = Math.round(level ?? 0);
  }
  return out;
}

export function groupBySkill(evidence: SkillEvidence[]): Record<SkillCode, SkillEvidence[]> {
  const out: Record<SkillCode, SkillEvidence[]> = {};
  for (const e of [...evidence].sort((a, b) => a.date.localeCompare(b.date))) {
    (out[e.skill] ??= []).push(e);
  }
  return out;
}

/** Faixas de domínio usadas no mapa de calor. Sem rótulos sobre o aluno, só sobre a habilidade. */
export type MasteryBand = "consolidada" | "em-progresso" | "precisa-de-apoio" | "sem-dados";

export function masteryBand(level: number | undefined): MasteryBand {
  if (level === undefined) return "sem-dados";
  if (level >= 70) return "consolidada";
  if (level >= 50) return "em-progresso";
  return "precisa-de-apoio";
}

import { computeMastery, groupBySkill, type SkillEvidence } from "./mastery";
import type { Skill, SkillCode } from "./types";

/**
 * Detector proativo. Roda todo dia, por aluno e habilidade.
 * Só regras simples e explicáveis: cada ponto do score tem um motivo que aparece na tela.
 */

export interface StudentSignals {
  studentId: string;
  firstName: string;
  evidence: SkillEvidence[];
  /** Frequência no período, 0 a 1. */
  attendance: number;
  /** Tarefas não entregues nos últimos 14 dias. */
  missingTasks: number;
}

export interface AlertReason {
  /** Frase curta para "por que estou vendo isso". */
  text: string;
  points: number;
}

export interface RiskAlert {
  studentId: string;
  skill: SkillCode;
  score: number; // 0 a 100
  /** Frase-decisão, sem rotular o aluno. */
  headline: string;
  reasons: AlertReason[];
  mastery: number;
  /** Queda relativa entre a base e as 3 últimas atividades (0.3 = caiu 30%). */
  drop: number;
}

export const ALERT_THRESHOLD = 50;
const RECENT = 3;

const pct = (e: SkillEvidence) => (e.total === 0 ? 0 : e.correct / e.total);
const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((s, x) => s + x, 0) / xs.length);

/** Queda relativa: média das atividades anteriores vs. média das 3 últimas. */
export function relativeDrop(items: SkillEvidence[]): number {
  if (items.length < RECENT + 1) return 0;
  const base = mean(items.slice(0, -RECENT).map(pct));
  const recent = mean(items.slice(-RECENT).map(pct));
  if (base === 0) return 0;
  return Math.max(0, Math.round(((base - recent) / base) * 100) / 100);
}

export function evaluateStudent(signals: StudentSignals, skills: Skill[]): RiskAlert[] {
  const bySkill = groupBySkill(signals.evidence);
  const mastery = computeMastery(signals.evidence);
  const skillMap = new Map(skills.map((s) => [s.code, s]));
  const alerts: RiskAlert[] = [];

  for (const [code, items] of Object.entries(bySkill)) {
    const reasons: AlertReason[] = [];
    const drop = relativeDrop(items);
    const level = mastery[code] ?? 0;
    const name = skillMap.get(code)?.shortName ?? code;

    if (drop >= 0.15) {
      const points = Math.min(50, Math.round(drop * 130));
      reasons.push({
        text: `Acertos em ${name} caíram ${Math.round(drop * 100)}% nas ${RECENT} últimas atividades`,
        points,
      });
    }
    if (level < 50) {
      reasons.push({
        text: `Domínio atual em ${name}: ${level} de 100`,
        points: Math.min(25, Math.round((50 - level) / 2)),
      });
    }
    if (signals.attendance < 0.85) {
      reasons.push({
        text: `Frequência de ${Math.round(signals.attendance * 100)}% no período`,
        points: Math.min(15, Math.round((0.85 - signals.attendance) * 100)),
      });
    }
    if (signals.missingTasks > 0) {
      reasons.push({
        text: `${signals.missingTasks} tarefa${signals.missingTasks > 1 ? "s" : ""} não entregue${signals.missingTasks > 1 ? "s" : ""} em 14 dias`,
        points: Math.min(15, signals.missingTasks * 5),
      });
    }

    const score = Math.min(100, reasons.reduce((s, r) => s + r.points, 0));
    // Frequência e tarefas sozinhas não abrem alerta de habilidade: precisa haver sinal na habilidade.
    const hasSkillSignal = drop >= 0.15 || level < 50;
    if (score >= ALERT_THRESHOLD && hasSkillSignal) {
      alerts.push({
        studentId: signals.studentId,
        skill: code,
        score,
        headline: `${signals.firstName} precisa de apoio em ${name}`,
        reasons: reasons.sort((a, b) => b.points - a.points),
        mastery: level,
        drop,
      });
    }
  }
  return alerts.sort((a, b) => b.score - a.score);
}

/** Frase-decisão do topo da tela: "4 alunos precisam de reforço em frações". */
export function summarizeAlerts(alerts: RiskAlert[], skills: Skill[]) {
  const bySkill = new Map<SkillCode, RiskAlert[]>();
  for (const a of alerts) bySkill.set(a.skill, [...(bySkill.get(a.skill) ?? []), a]);
  const ranked = [...bySkill.entries()].sort((a, b) => b[1].length - a[1].length);
  const top = ranked[0];
  if (!top) return null;
  const skill = skills.find((s) => s.code === top[0]);
  const n = top[1].length;
  return {
    skill: top[0],
    count: n,
    sentence: `${n} aluno${n > 1 ? "s" : ""} precisa${n > 1 ? "m" : ""} de reforço em ${skill?.shortName ?? top[0]}`,
    studentIds: top[1].map((a) => a.studentId),
  };
}

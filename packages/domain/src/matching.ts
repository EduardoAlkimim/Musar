import type { SkillCode, Tutor } from "./types";

/**
 * Matching com professor de reforço.
 * Especialidade × disponibilidade × histórico de sucesso. Mostra os 3 melhores e o porquê.
 */

export interface TutorMatch {
  tutor: Tutor;
  score: number; // 0 a 100
  reasons: string[];
  nextSlot: string | null;
}

const WEIGHTS = { specialty: 50, availability: 20, success: 30 } as const;

export function matchTutors(
  skill: SkillCode,
  skillName: string,
  tutors: Tutor[],
  preferredSlots: string[] = [],
  limit = 3,
): TutorMatch[] {
  const matches = tutors.map((tutor) => {
    const reasons: string[] = [];
    let score = 0;

    if (tutor.specialties.includes(skill)) {
      score += WEIGHTS.specialty;
      reasons.push(`Especialista em ${skillName}`);
    }

    const overlap = preferredSlots.length
      ? tutor.slots.filter((s) => preferredSlots.includes(s))
      : tutor.slots;
    if (overlap.length > 0) {
      score += WEIGHTS.availability * Math.min(1, overlap.length / 2);
      reasons.push(`Livre ${overlap[0]}`);
    }

    const h = tutor.history[skill];
    if (h && h.total > 0) {
      // Suavização: poucos atendimentos não viram 100% de sucesso.
      const rate = (h.closed + 1) / (h.total + 2);
      score += WEIGHTS.success * rate;
      reasons.push(`${h.closed} de ${h.total} alunos fecharam o reforço nessa habilidade`);
    }

    return {
      tutor,
      score: Math.round(score),
      reasons,
      nextSlot: overlap[0] ?? null,
    };
  });

  return matches
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Plano sugerido: sessões de 50 minutos até o domínio chegar a 70, entre 2 e 6. */
export function sessoesDoPlano(dominio: number) {
  return Math.min(6, Math.max(2, Math.ceil((70 - dominio) / 8)));
}

/** Menor de idade precisa da aprovação de um responsável para o reforço. */
export function ehMenor(dataNascimento: Date | string | null | undefined, hoje = new Date()) {
  if (!dataNascimento) return true; // sem data, trata como menor: falha do lado seguro
  const d = new Date(dataNascimento);
  let idade = hoje.getUTCFullYear() - d.getUTCFullYear();
  const m = hoje.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && hoje.getUTCDate() < d.getUTCDate())) idade -= 1;
  return idade < 18;
}

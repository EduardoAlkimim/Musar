import { demo, matchTutors } from "@escola/domain";
import type { OpcaoTutor } from "@/components/encaminhar";

/** Os 3 professores de reforço mais indicados para a habilidade, no formato da tela. */
export function opcoesDeReforco(skill: string): OpcaoTutor[] {
  const nome = demo.skillByCode(skill)?.shortName ?? skill;
  return matchTutors(skill, nome, demo.TUTORS).map((m) => ({
    id: m.tutor.id,
    nome: m.tutor.name,
    score: m.score,
    motivos: m.reasons,
    horario: m.nextSlot,
    modo: m.tutor.mode === "ambos" ? "presencial ou online" : m.tutor.mode,
  }));
}

export const nomeAluno = (id: string) => demo.studentById(id)?.name ?? id;
export const primeiroNome = (id: string) => nomeAluno(id).split(" ")[0]!;
export const nomeHabilidade = (code: string) => demo.skillByCode(code)?.shortName ?? code;

export function listaNomes(nomes: string[]) {
  if (nomes.length <= 1) return nomes.join("");
  return `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}`;
}

/** Plano sugerido: sessões de 50 min até o domínio chegar a 70, entre 2 e 6. */
export function sessoesDoPlano(dominio: number) {
  return Math.min(6, Math.max(2, Math.ceil((70 - dominio) / 8)));
}

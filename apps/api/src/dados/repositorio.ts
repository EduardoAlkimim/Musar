import { demo, type Assessment, type SchoolClass, type Skill, type StudentAnswer, type Tutor } from "@escola/domain";
import type { StudentSignals } from "@escola/domain";

/**
 * Acesso a dados da escola. Toda leitura recebe o school_id: nenhuma consulta sem escola.
 * Hoje: escola de demonstração em memória. Próximo passo: implementação Prisma com RLS no PostgreSQL.
 */
export interface RepositorioEscolar {
  turma(schoolId: string, classId: string): Promise<SchoolClass | null>;
  alunosDaTurma(schoolId: string, classId: string): Promise<{ id: string; name: string }[]>;
  habilidades(schoolId: string): Promise<Skill[]>;
  prova(schoolId: string, assessmentId: string): Promise<Assessment | null>;
  respostas(schoolId: string, assessmentId: string): Promise<StudentAnswer[]>;
  sinaisDaTurma(schoolId: string, classId: string): Promise<StudentSignals[]>;
  professoresDeReforco(schoolId: string): Promise<Tutor[]>;
}

export const REPOSITORIO = Symbol("RepositorioEscolar");

export class RepositorioDemo implements RepositorioEscolar {
  private daEscola(schoolId: string) {
    return schoolId === demo.DEMO_SCHOOL.id;
  }

  async turma(schoolId: string, classId: string) {
    return this.daEscola(schoolId) ? (demo.classById(classId) ?? null) : null;
  }

  async alunosDaTurma(schoolId: string, classId: string) {
    if (!this.daEscola(schoolId)) return [];
    return demo.studentsOfClass(classId).map((s) => ({ id: s.id, name: s.name }));
  }

  async habilidades(schoolId: string) {
    return this.daEscola(schoolId) ? demo.SKILLS : [];
  }

  async prova(schoolId: string, assessmentId: string) {
    return this.daEscola(schoolId) && assessmentId === demo.ASSESSMENT.id ? demo.ASSESSMENT : null;
  }

  async respostas(schoolId: string, assessmentId: string) {
    return this.daEscola(schoolId) && assessmentId === demo.ASSESSMENT.id ? demo.ANSWERS : [];
  }

  async sinaisDaTurma(schoolId: string, classId: string) {
    if (!this.daEscola(schoolId)) return [];
    return demo.SIGNALS.filter((s) => s.studentId.startsWith(`${classId}-`));
  }

  async professoresDeReforco(schoolId: string) {
    return this.daEscola(schoolId) ? demo.TUTORS : [];
  }
}

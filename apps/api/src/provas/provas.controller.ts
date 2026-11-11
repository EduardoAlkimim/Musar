import { BadRequestException, Body, Controller, Get, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { gradeAssessment } from "@escola/domain";
import { REPOSITORIO, type RepositorioEscolar } from "../dados/repositorio";

const CorpoCorrecao = z.object({
  respostas: z
    .array(
      z.object({
        studentId: z.string().min(1),
        questionId: z.string().min(1),
        chosen: z.number().int().min(0).max(4).nullable(),
        timeSeconds: z.number().int().min(0).optional(),
      }),
    )
    .min(1)
    .max(20_000),
});

/** Correção determinística: o gabarito decide, sem IA. */
@Controller("escolas/:escola/provas")
export class ProvasController {
  constructor(@Inject(REPOSITORIO) private readonly repo: RepositorioEscolar) {}

  @Get(":prova/relatorio")
  async relatorio(@Param("escola") escola: string, @Param("prova") id: string) {
    const prova = await this.exigirProva(escola, id);
    const alunos = await this.repo.alunosDaTurma(escola, prova.classId);
    return gradeAssessment(prova, alunos.map((a) => a.id), await this.repo.respostas(escola, id));
  }

  @Post(":prova/correcao")
  async corrigir(@Param("escola") escola: string, @Param("prova") id: string, @Body() corpo: unknown) {
    const prova = await this.exigirProva(escola, id);
    const parsed = CorpoCorrecao.safeParse(corpo);
    if (!parsed.success) throw new BadRequestException({ erro: "Respostas inválidas", detalhes: parsed.error.issues });

    const alunos = new Set((await this.repo.alunosDaTurma(escola, prova.classId)).map((a) => a.id));
    const questoes = new Set(prova.questions.map((q) => q.id));
    const fora = parsed.data.respostas.find((r) => !alunos.has(r.studentId) || !questoes.has(r.questionId));
    if (fora) throw new BadRequestException({ erro: "Resposta de aluno ou questão fora desta prova", resposta: fora });

    const respostas = parsed.data.respostas;
    return gradeAssessment(prova, [...new Set(respostas.map((r) => r.studentId))], respostas);
  }

  private async exigirProva(escola: string, id: string) {
    const prova = await this.repo.prova(escola, id);
    if (!prova) throw new NotFoundException({ erro: "Prova não encontrada nesta escola" });
    return prova;
  }
}

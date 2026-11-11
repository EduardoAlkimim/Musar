import { Controller, Get, Inject, NotFoundException, Param } from "@nestjs/common";
import { evaluateStudent, summarizeAlerts } from "@escola/domain";
import { REPOSITORIO, type RepositorioEscolar } from "../dados/repositorio";

/**
 * Detector proativo. Em produção roda num worker BullMQ todo dia e grava os alertas;
 * aqui calcula sob demanda com as mesmas regras.
 */
@Controller("escolas/:escola/turmas/:turma/alertas")
export class AlertasController {
  constructor(@Inject(REPOSITORIO) private readonly repo: RepositorioEscolar) {}

  @Get()
  async listar(@Param("escola") escola: string, @Param("turma") turma: string) {
    if (!(await this.repo.turma(escola, turma))) throw new NotFoundException({ erro: "Turma não encontrada nesta escola" });
    const habilidades = await this.repo.habilidades(escola);
    const sinais = await this.repo.sinaisDaTurma(escola, turma);
    const alertas = sinais.flatMap((s) => evaluateStudent(s, habilidades)).sort((a, b) => b.score - a.score);
    return { resumo: summarizeAlerts(alertas, habilidades), alertas };
  }
}

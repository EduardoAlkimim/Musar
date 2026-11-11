import { BadRequestException, Controller, Get, Inject, Param, Query } from "@nestjs/common";
import { matchTutors } from "@escola/domain";
import { REPOSITORIO, type RepositorioEscolar } from "../dados/repositorio";

/** Os 3 professores de reforço mais indicados para uma habilidade, com o porquê. */
@Controller("escolas/:escola/reforco")
export class ReforcoController {
  constructor(@Inject(REPOSITORIO) private readonly repo: RepositorioEscolar) {}

  @Get("sugestoes")
  async sugestoes(@Param("escola") escola: string, @Query("habilidade") habilidade?: string) {
    if (!habilidade || !/^EF\d{2}[A-Z]{2}\d{2}$/.test(habilidade)) {
      throw new BadRequestException({ erro: "Informe a habilidade pelo código BNCC, ex.: EF06MA07" });
    }
    const skill = (await this.repo.habilidades(escola)).find((s) => s.code === habilidade);
    const tutores = await this.repo.professoresDeReforco(escola);
    return matchTutors(habilidade, skill?.shortName ?? habilidade, tutores).map((m) => ({
      professor: { id: m.tutor.id, nome: m.tutor.name, modo: m.tutor.mode },
      score: m.score,
      motivos: m.reasons,
      proximoHorario: m.nextSlot,
    }));
  }
}

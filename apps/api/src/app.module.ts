import { Controller, Get, Module } from "@nestjs/common";
import { REPOSITORIO, RepositorioDemo } from "./dados/repositorio";
import { CamadaLlm, configDoAmbiente, LLM, ProvedorBedrock } from "./ia/llm";
import { AlertasController } from "./alertas/alertas.controller";
import { ProvasController } from "./provas/provas.controller";
import { ReforcoController } from "./reforco/reforco.controller";

@Controller("saude")
class SaudeController {
  @Get()
  saude() {
    return { ok: true };
  }
}

@Module({
  controllers: [SaudeController, ProvasController, AlertasController, ReforcoController],
  providers: [
    { provide: REPOSITORIO, useClass: RepositorioDemo },
    { provide: LLM, useFactory: () => new CamadaLlm(new ProvedorBedrock(), configDoAmbiente()) },
  ],
})
export class AppModule {}

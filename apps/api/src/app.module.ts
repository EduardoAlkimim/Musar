import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { GuardaDeAcesso, prismaProvider } from "./base";
import { DetectorJob } from "./detector.job";
import { CamadaLlm, configDoAmbiente, LLM, ProvedorBedrock } from "./ia/llm";
import { AdminController } from "./rotas/admin.controller";
import { AlunoController } from "./rotas/aluno.controller";
import { CoordenacaoController } from "./rotas/coordenacao.controller";
import { FamiliaController } from "./rotas/familia.controller";
import { MeController } from "./rotas/me.controller";
import { MensagensController } from "./rotas/mensagens.controller";
import { ProfessorController } from "./rotas/professor.controller";
import { ReforcoController } from "./rotas/reforco.controller";

@Module({
  controllers: [MeController, ProfessorController, ReforcoController, FamiliaController, MensagensController, AlunoController, CoordenacaoController, AdminController],
  providers: [
    prismaProvider,
    { provide: APP_GUARD, useClass: GuardaDeAcesso },
    { provide: LLM, useFactory: () => new CamadaLlm(new ProvedorBedrock(), configDoAmbiente()) },
    DetectorJob,
  ],
})
export class AppModule {}

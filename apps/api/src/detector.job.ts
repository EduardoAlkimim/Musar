import { Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from "@nestjs/common";
import { comEscola, criarPrisma, rodarDetector } from "@escola/db";
import { CONFIG } from "./base";

/**
 * Detector diário. Roda ao subir a API e a cada 24 h, escola por escola.
 * Local: um timer no próprio processo. Em produção: worker BullMQ separado (documento de produto).
 */
@Injectable()
export class DetectorJob implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly log = new Logger("Detector");
  private timer?: NodeJS.Timeout;
  private readonly prisma = criarPrisma(CONFIG.dbUrlJob);

  onApplicationBootstrap() {
    if (process.env.DETECTOR_DIARIO === "0") return;
    void this.rodar();
    this.timer = setInterval(() => void this.rodar(), 24 * 60 * 60 * 1000);
  }

  async onApplicationShutdown() {
    clearInterval(this.timer);
    await this.prisma.$disconnect();
  }

  async rodar() {
    try {
      for (const e of await this.prisma.school.findMany({ select: { id: true, slug: true } })) {
        const r = await comEscola(this.prisma, { userId: "00000000-0000-0000-0000-000000000000", schoolId: e.id }, (tx) => rodarDetector(tx, e.id));
        this.log.log(`${e.slug}: ${r.criados} novos, ${r.atualizados} atualizados, ${r.resolvidos} resolvidos`);
      }
    } catch (err) {
      this.log.error(`Falhou: ${(err as Error).message}`);
    }
  }
}

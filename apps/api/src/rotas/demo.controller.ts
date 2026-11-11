import { Controller, ForbiddenException, NotFoundException, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { criarPrisma, semear } from "@escola/db";
import { CONFIG, Publico } from "../base";

/**
 * Modo demonstração (apresentações de venda): recria a escola de demonstração do zero.
 * Só existe com DEMO_MODE=1 e só aceita chamadas da própria máquina. Nunca ligar em produção.
 */
@Controller("demo")
export class DemoController {
  @Post("reiniciar")
  @Publico()
  async reiniciar(@Req() req: Request) {
    if (process.env.DEMO_MODE !== "1") throw new NotFoundException();
    const ip = req.socket.remoteAddress ?? "";
    if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ip)) throw new ForbiddenException({ erro: "Só na máquina local" });
    const prisma = criarPrisma(CONFIG.dbUrlJob);
    try {
      return await semear(prisma);
    } finally {
      await prisma.$disconnect();
    }
  }
}

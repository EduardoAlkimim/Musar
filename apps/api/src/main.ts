import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function iniciar() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: false });
  app.enableShutdownHooks();
  app.useBodyParser("json", { limit: "3mb" });
  const porta = Number(process.env.PORT ?? 4000);
  await app.listen(porta);
  console.log(`API em http://localhost:${porta}/api`);
}

void iniciar();

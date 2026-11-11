import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function iniciar() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableShutdownHooks();
  const porta = Number(process.env.PORT ?? 4000);
  await app.listen(porta);
  console.log(`API em http://localhost:${porta}/api`);
}

void iniciar();

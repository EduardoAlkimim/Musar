import { Controller, Get } from "@nestjs/common";
import { Publico, Usuario, type Sessao } from "../base";

@Controller()
export class MeController {
  @Get("saude")
  @Publico()
  saude() {
    return { ok: true };
  }

  /** Quem está logado, em qual escola e com quais papéis. */
  @Get("me")
  me(@Usuario() s: Sessao) {
    return { id: s.userId, nome: s.nome, email: s.email, escola: s.escola, papeis: s.papeis, escolas: s.escolas };
  }
}

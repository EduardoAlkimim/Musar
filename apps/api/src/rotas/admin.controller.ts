import { BadRequestException, Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { z } from "zod";
import type { PrismaClient } from "@escola/db";
import { naEscola, Papeis, PRISMA, Usuario, type Sessao } from "../base";

export const COLUNAS = ["nome", "email", "data_nascimento", "turma", "serie", "turno", "responsavel_nome", "responsavel_email"] as const;
const TURNOS = { manha: "MANHA", "manhã": "MANHA", tarde: "TARDE", noite: "NOITE", integral: "INTEGRAL" } as const;

const Linha = z.object({
  nome: z.string().trim().min(3, "nome muito curto"),
  email: z.string().trim().toLowerCase().email("e-mail inválido"),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data no formato AAAA-MM-DD"),
  turma: z.string().trim().min(2, "turma vazia"),
  serie: z.string().trim().min(2, "série vazia"),
  turno: z.string().trim().toLowerCase().refine((t) => t in TURNOS, "turno: manhã, tarde, noite ou integral"),
  responsavel_nome: z.string().trim().optional().default(""),
  responsavel_email: z.union([z.literal(""), z.string().trim().toLowerCase().email("e-mail do responsável inválido")]).optional().default(""),
});

/** CSV simples: separador vírgula ou ponto e vírgula (Excel em pt-BR), aspas duplas opcionais. */
export function lerCsv(texto: string): string[][] {
  const linhas = texto.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  const sep = (linhas[0] ?? "").split(";").length > (linhas[0] ?? "").split(",").length ? ";" : ",";
  return linhas.map((linha) => {
    const campos: string[] = [];
    let atual = "";
    let aspas = false;
    for (let i = 0; i < linha.length; i++) {
      const c = linha[i]!;
      if (c === '"' && linha[i + 1] === '"' && aspas) {
        atual += '"';
        i++;
      } else if (c === '"') aspas = !aspas;
      else if (c === sep && !aspas) {
        campos.push(atual);
        atual = "";
      } else atual += c;
    }
    campos.push(atual);
    return campos.map((x) => x.trim());
  });
}

@Controller("admin")
export class AdminController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  @Get("resumo")
  @Papeis("ADMIN")
  resumo(@Usuario() s: Sessao) {
    return naEscola(this.prisma, s, async (tx) => ({
      escola: s.escola,
      turmas: await tx.schoolClass.count(),
      alunos: await tx.enrollment.count(),
      pessoas: await tx.membership.count({ where: { schoolId: s.schoolId } }),
      colunas: COLUNAS,
    }));
  }

  /**
   * Importação de alunos e turmas por planilha. Valida tudo antes de gravar:
   * se uma linha tiver erro, nada é gravado e a resposta diz qual linha e por quê.
   */
  @Post("importar")
  @Papeis("ADMIN")
  async importar(@Usuario() s: Sessao, @Body() corpo: { csv?: unknown; simular?: unknown }) {
    if (typeof corpo?.csv !== "string" || corpo.csv.length > 2_000_000) throw new BadRequestException({ erro: "Envie o CSV (até 2 MB)" });
    const [cabecalho, ...dados] = lerCsv(corpo.csv);
    const cols = (cabecalho ?? []).map((c) => c.toLowerCase());
    const faltam = COLUNAS.slice(0, 6).filter((c) => !cols.includes(c));
    if (faltam.length) throw new BadRequestException({ erro: `Faltam colunas: ${faltam.join(", ")}`, colunas: COLUNAS });
    if (dados.length === 0) throw new BadRequestException({ erro: "A planilha não tem alunos" });

    const erros: { linha: number; erro: string }[] = [];
    const validas = dados.flatMap((campos, i) => {
      const obj = Object.fromEntries(cols.map((c, j) => [c, campos[j] ?? ""]));
      const r = Linha.safeParse(obj);
      if (!r.success) {
        erros.push({ linha: i + 2, erro: r.error.issues.map((x) => x.message).join("; ") });
        return [];
      }
      return [r.data];
    });
    const repetidos = validas.map((v) => v.email).filter((e, i, a) => a.indexOf(e) !== i);
    for (const e of new Set(repetidos)) erros.push({ linha: 0, erro: `E-mail repetido na planilha: ${e}` });
    if (erros.length) throw new BadRequestException({ erro: "A planilha tem erros. Nada foi gravado.", erros });

    const ano = new Date().getFullYear();
    const resultado = { turmasCriadas: 0, alunosCriados: 0, alunosAtualizados: 0, responsaveis: 0 };
    if (corpo.simular === true) return { simulado: true, linhas: validas.length };

    await naEscola(this.prisma, s, async (tx) => {
      for (const l of validas) {
        let turma = await tx.schoolClass.findFirst({ where: { nome: l.turma, anoLetivo: ano } });
        if (!turma) {
          turma = await tx.schoolClass.create({ data: { schoolId: s.schoolId, nome: l.turma, serie: l.serie, anoLetivo: ano, turno: TURNOS[l.turno as keyof typeof TURNOS] } });
          resultado.turmasCriadas += 1;
        }
        const existente = await tx.user.findUnique({ where: { email: l.email } });
        // O cadastro é global: só atualizamos nome e nascimento de quem já é desta escola,
        // para uma escola nunca alterar os dados de alguém de outra.
        const jaNaEscola = existente && (await tx.membership.count({ where: { schoolId: s.schoolId, userId: existente.id } })) > 0;
        const nascimento = new Date(`${l.data_nascimento}T00:00:00Z`);
        const aluno = !existente
          ? await tx.user.create({ data: { email: l.email, nome: l.nome, dataNascimento: nascimento } })
          : jaNaEscola
            ? await tx.user.update({ where: { id: existente.id }, data: { nome: l.nome, dataNascimento: nascimento } })
            : existente;
        resultado[existente ? "alunosAtualizados" : "alunosCriados"] += 1;
        await tx.membership.upsert({
          where: { schoolId_userId: { schoolId: s.schoolId, userId: aluno.id } },
          create: { schoolId: s.schoolId, userId: aluno.id, papeis: ["ALUNO"] },
          update: {},
        });
        await tx.enrollment.deleteMany({ where: { studentId: aluno.id, classId: { not: turma.id } } });
        await tx.enrollment.upsert({
          where: { classId_studentId: { classId: turma.id, studentId: aluno.id } },
          create: { schoolId: s.schoolId, classId: turma.id, studentId: aluno.id },
          update: {},
        });

        if (l.responsavel_email) {
          const resp = await tx.user.upsert({
            where: { email: l.responsavel_email },
            create: { email: l.responsavel_email, nome: l.responsavel_nome || l.responsavel_email },
            update: {},
          });
          const v = await tx.membership.findUnique({ where: { schoolId_userId: { schoolId: s.schoolId, userId: resp.id } } });
          if (!v) await tx.membership.create({ data: { schoolId: s.schoolId, userId: resp.id, papeis: ["RESPONSAVEL"] } });
          else if (!v.papeis.includes("RESPONSAVEL")) await tx.membership.update({ where: { id: v.id }, data: { papeis: [...v.papeis, "RESPONSAVEL"] } });
          await tx.guardianLink.upsert({
            where: { guardianId_studentId: { guardianId: resp.id, studentId: aluno.id } },
            create: { schoolId: s.schoolId, guardianId: resp.id, studentId: aluno.id },
            update: {},
          });
          resultado.responsaveis += 1;
        }
      }
    });
    return { linhas: validas.length, ...resultado };
  }
}

export const MARCA = "MUSAR";
export const SLOGAN = "A evolução da educação";

export type Papel = "ALUNO" | "PROFESSOR" | "PROFESSOR_REFORCO" | "DIRETOR" | "COORDENADOR" | "RESPONSAVEL" | "ADMIN";

export const NOME_PAPEL: Record<Papel, string> = {
  DIRETOR: "Direção",
  COORDENADOR: "Coordenação",
  ADMIN: "Secretaria",
  PROFESSOR: "Professor(a)",
  PROFESSOR_REFORCO: "Reforço",
  RESPONSAVEL: "Responsável",
  ALUNO: "Aluno(a)",
};

export interface ItemMenu {
  href: string;
  rotulo: string;
  icone: "visao" | "alerta" | "turmas" | "equipe" | "reforco" | "relatorio" | "cadastro" | "provas" | "mensagens" | "agenda" | "familia" | "aluno";
}

const GESTAO: ItemMenu[] = [
  { href: "/gestao", rotulo: "Visão geral", icone: "visao" },
  { href: "/gestao/alertas", rotulo: "Alertas de risco", icone: "alerta" },
  { href: "/gestao/turmas", rotulo: "Turmas", icone: "turmas" },
  { href: "/gestao/equipe", rotulo: "Equipe", icone: "equipe" },
  { href: "/gestao/reforcos", rotulo: "Reforços", icone: "reforco" },
  { href: "/gestao/relatorios", rotulo: "Relatórios", icone: "relatorio" },
];

/** Menu de cada visão. A ordem dos papéis define a visão inicial de quem tem mais de um. */
export const MENUS: { papel: Papel; itens: ItemMenu[] }[] = [
  { papel: "DIRETOR", itens: GESTAO },
  { papel: "COORDENADOR", itens: GESTAO },
  { papel: "ADMIN", itens: [{ href: "/admin", rotulo: "Cadastros", icone: "cadastro" }, ...GESTAO] },
  {
    papel: "PROFESSOR",
    itens: [
      { href: "/professor", rotulo: "Minhas turmas", icone: "turmas" },
      { href: "/professor/provas", rotulo: "Provas", icone: "provas" },
      { href: "/mensagens", rotulo: "Mensagens", icone: "mensagens" },
    ],
  },
  { papel: "PROFESSOR_REFORCO", itens: [{ href: "/reforco", rotulo: "Agenda e alunos", icone: "agenda" }] },
  {
    papel: "RESPONSAVEL",
    itens: [
      { href: "/familia", rotulo: "Acompanhamento", icone: "familia" },
      { href: "/mensagens", rotulo: "Mensagens", icone: "mensagens" },
    ],
  },
  { papel: "ALUNO", itens: [{ href: "/aluno", rotulo: "Meu desempenho", icone: "aluno" }] },
];

export const visoesDe = (papeis: Papel[]) => MENUS.filter((m) => papeis.includes(m.papel));
export const inicioDe = (papeis: Papel[]) => visoesDe(papeis)[0]?.itens[0]?.href ?? "/";

export interface Me {
  id: string;
  nome: string;
  email: string;
  escola: { id: string; nome: string; slug: string };
  papeis: Papel[];
}

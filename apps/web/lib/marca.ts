/** Nome provisório (documento de produto: Rumo, Trilha ou Lume). Trocar aqui muda a plataforma toda. */
export const MARCA = "Trilha";

export type Papel = "ALUNO" | "PROFESSOR" | "PROFESSOR_REFORCO" | "COORDENADOR" | "RESPONSAVEL" | "ADMIN";

/** Área de cada papel. A ordem define a tela inicial de quem tem mais de um. */
export const AREAS: { papel: Papel; href: string; rotulo: string }[] = [
  { papel: "PROFESSOR", href: "/professor", rotulo: "Turmas" },
  { papel: "PROFESSOR_REFORCO", href: "/reforco", rotulo: "Reforço" },
  { papel: "COORDENADOR", href: "/coordenacao", rotulo: "Escola" },
  { papel: "ADMIN", href: "/admin", rotulo: "Cadastros" },
  { papel: "RESPONSAVEL", href: "/familia", rotulo: "Família" },
  { papel: "ALUNO", href: "/aluno", rotulo: "Meus estudos" },
];

export const areasDe = (papeis: Papel[]) => AREAS.filter((a) => papeis.includes(a.papel));

export interface Me {
  id: string;
  nome: string;
  email: string;
  escola: { id: string; nome: string; slug: string };
  papeis: Papel[];
}

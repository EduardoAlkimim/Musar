/**
 * Roteiro da demonstração guiada (apresentação de venda).
 * Cada passo entra como uma pessoa da escola, abre a tela certa e diz o que fazer.
 * Só funciona com DEMO_MODE=1 (máquina local). Nunca ligar em produção.
 */
export const demoLigado = () => process.env.DEMO_MODE === "1";
export const COOKIE_DEMO = "musar_demo";

export interface Passo {
  n: number;
  conta: string;
  pessoa: string;
  papel: string;
  rota: string;
  titulo: string;
  /** O que a pessoa da apresentação deve fazer nesta tela. */
  fazer: string;
  /** O que dizer para quem está assistindo. */
  mensagem: string;
  /** Elemento destacado na tela (data-demo). */
  alvo?: string;
}

export const PASSOS: Passo[] = [
  {
    n: 1,
    conta: "ana",
    pessoa: "Ana Moura",
    papel: "Direção",
    rota: "/gestao",
    titulo: "A direção vê a escola inteira numa tela",
    mensagem: "Total de alunos, quem está em risco, reforços ativos e a média geral, com a evolução de cada turma e a disciplina que mais preocupa.",
    fazer: "Mostre os números do topo, o gráfico por turma e a lista “Alunos com alerta ativo”.",
    alvo: "alunos-alerta",
  },
  {
    n: 2,
    conta: "ana",
    pessoa: "Ana Moura",
    papel: "Direção",
    rota: "/gestao/alertas",
    titulo: "A direção indica o professor de reforço",
    mensagem: "O MUSAR sugere o professor mais indicado e explica o porquê, mas a direção escolhe quem quiser da equipe de reforço.",
    fazer: "Na linha do João, clique em “Indicar reforço”. Mostre os sugeridos e os outros professores, e indique o Renato.",
    alvo: "alerta-joao",
  },
  {
    n: 3,
    conta: "marta",
    pessoa: "Marta Ribeiro",
    papel: "Professora de Matemática",
    rota: "/professor",
    titulo: "A professora acompanha a turma e a prova",
    mensagem: "Ela vê quem caiu em cada habilidade, o mapa da turma e a prova corrigida pelo gabarito, com a questão que quase todos erraram.",
    fazer: "Mostre o mapa da turma e clique em “Ver a prova corrigida”.",
    alvo: "ver-prova",
  },
  {
    n: 4,
    conta: "helena",
    pessoa: "Helena Gomes",
    papel: "Mãe do João",
    rota: "/familia",
    titulo: "A família acompanha e aprova o reforço",
    mensagem: "No primeiro acesso a mãe autoriza o uso dos dados (LGPD). Depois vê notas, frequência e aprova o reforço pelo celular.",
    fazer: "Clique em “Li e autorizo” e depois em “Aprovar o reforço”.",
    alvo: "familia",
  },
  {
    n: 5,
    conta: "renato",
    pessoa: "Renato Siqueira",
    papel: "Professor de reforço",
    rota: "/reforco",
    titulo: "O reforço chega com o diagnóstico pronto",
    mensagem: "O professor de reforço recebe a habilidade, os motivos e um plano de sessões. Só falta marcar o horário.",
    fazer: "No card do João, clique em “Aceitar plano e agendar”.",
    alvo: "pedido-aprovado",
  },
  {
    n: 6,
    conta: "joao",
    pessoa: "João Gomes",
    papel: "Aluno do 6º B",
    rota: "/aluno",
    titulo: "O aluno vê o próprio desempenho",
    mensagem: "Nota, por que errou cada questão e o reforço já agendado.",
    fazer: "Mostre a revisão da prova e o reforço.",
    alvo: "revisao",
  },
  {
    n: 7,
    conta: "admin",
    pessoa: "Secretaria",
    papel: "Cadastros",
    rota: "/admin",
    titulo: "Implantar é trazer a planilha que a escola já tem",
    mensagem: "A secretaria importa alunos, turmas e responsáveis de uma planilha. Se uma linha tiver erro, nada é gravado e aparece qual corrigir.",
    fazer: "Baixe a planilha modelo, escolha o arquivo, clique em Conferir e depois em Importar.",
    alvo: "importar",
  },
];

export const passo = (n: number) => PASSOS.find((p) => p.n === n);

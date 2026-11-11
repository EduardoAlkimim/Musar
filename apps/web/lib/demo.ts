/**
 * Roteiro da demonstração guiada (apresentação de venda).
 * Cada passo entra como uma pessoa da escola, abre a tela certa e diz o que fazer.
 * Só funciona com DEMO_MODE=1 (máquina local). Nunca ligar em produção.
 */
export const demoLigado = () => process.env.DEMO_MODE === "1";
export const COOKIE_DEMO = "trilha_demo";

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
    conta: "marta",
    pessoa: "Marta Ribeiro",
    papel: "Professora de Matemática",
    rota: "/professor",
    titulo: "A professora abre o dia com uma decisão",
    mensagem: "Ninguém pediu nada. A Trilha percebeu sozinha que 5 alunos caíram em frações e já diz quem são e por quê.",
    fazer: "Abra “Por que estou vendo isso” no João e depois clique em Encaminhar. Escolha o Renato.",
    alvo: "alerta-joao",
  },
  {
    n: 2,
    conta: "marta",
    pessoa: "Marta Ribeiro",
    papel: "Professora de Matemática",
    rota: "/professor",
    titulo: "A prova se corrige e aponta o que ensinar de novo",
    mensagem: "Correção pelo gabarito, sem IA. O relatório mostra a questão que quase todos erraram, o erro típico e a questão que pode estar ambígua.",
    fazer: "Clique em “Ver a prova corrigida” e desça até a questão 9.",
    alvo: "ver-prova",
  },
  {
    n: 3,
    conta: "helena",
    pessoa: "Helena Gomes",
    papel: "Mãe do João",
    rota: "/familia",
    titulo: "A família recebe o pedido, em linguagem simples",
    mensagem: "No primeiro acesso, a mãe autoriza o uso dos dados (LGPD). Depois aprova o reforço e fala com a professora, tudo pelo celular.",
    fazer: "Clique em “Li e autorizo”. Depois aprove o reforço e mande uma mensagem para a professora.",
    alvo: "familia",
  },
  {
    n: 4,
    conta: "renato",
    pessoa: "Renato Siqueira",
    papel: "Professor de reforço",
    rota: "/reforco",
    titulo: "O reforço chega com o diagnóstico pronto",
    mensagem: "O professor de reforço não começa do zero: recebe a habilidade, os motivos e um plano de sessões. Só falta marcar o horário.",
    fazer: "No card do João, clique em “Aceitar plano e agendar”.",
    alvo: "pedido-aprovado",
  },
  {
    n: 5,
    conta: "joao",
    pessoa: "João Gomes",
    papel: "Aluno do 6º B",
    rota: "/aluno",
    titulo: "O aluno vê um próximo passo, não um boletim",
    mensagem: "Em vez de só a nota, o João vê por que errou cada questão e por onde começar a revisar.",
    fazer: "Mostre a revisão da prova e o reforço já agendado.",
    alvo: "revisao",
  },
  {
    n: 6,
    conta: "beatriz",
    pessoa: "Beatriz Lemos",
    papel: "Coordenação pedagógica",
    rota: "/coordenacao",
    titulo: "A coordenação enxerga a escola inteira",
    mensagem: "Turmas em queda, professores sem lançar atividade e o mesmo conteúdo comparado entre professores, sem montar planilha.",
    fazer: "Mostre a tabela de turmas e matérias e a comparação entre professores.",
    alvo: "ranking",
  },
  {
    n: 7,
    conta: "admin",
    pessoa: "Secretaria",
    papel: "Cadastros",
    rota: "/admin",
    titulo: "Começar é trazer a planilha que a escola já tem",
    mensagem: "A secretaria importa alunos, turmas e responsáveis de uma planilha. Se uma linha tiver erro, nada é gravado e aparece qual linha corrigir.",
    fazer: "Baixe a planilha modelo, escolha o arquivo, clique em Conferir e depois em Importar.",
    alvo: "importar",
  },
];

export const passo = (n: number) => PASSOS.find((p) => p.n === n);

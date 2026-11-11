---
name: design-musar
description: Sistema visual do MUSAR (gestão escolar). Use antes de criar ou alterar qualquer tela, componente, cor, fonte ou ícone em apps/web. Mantém o padrão do protótipo original do MUSAR.
---

# Design MUSAR

O MUSAR é um aplicativo de **gestão escolar**. A direção é o centro: vê a escola inteira e decide. A referência visual é o protótipo original do MUSAR (barra lateral azul-marinho, painel com cartões, tabelas e selos de risco).

## Estrutura de toda tela logada

1. **Barra lateral** azul-marinho (`components/shell.tsx`): arara + "MUSAR" em dourado, seletor de visão (quando a pessoa tem mais de um papel), menu da visão, escola e usuário no rodapé.
2. **Barra do topo** branca: título da área ativa, selo dourado do perfil, atalho de mensagens e iniciais.
3. **Conteúdo** sobre fundo creme: título da página, avisos, indicadores e cartões.

Menus por visão ficam em `lib/marca.ts` (`MENUS`). Direção e coordenação usam o mesmo menu de gestão.

## Componentes (`components/ui.tsx`)

| Componente | Uso |
| --- | --- |
| `Titulo` | Título e subtítulo da página, com ações à direita |
| `Decisao` | Cartão de abertura com faixa dourada: contexto, frase principal, detalhe e ações |
| `Indicador` | Número de destaque (total de alunos, em risco, reforços, média) com ícone e variação |
| `Card` | Cartão branco com título, ícone dourado e ação ("Ver todos →") |
| `Aviso` | Faixa de alerta (vermelha, âmbar ou azul) |
| `Nivel` | Selo de risco: Alto (vermelho), Médio (âmbar), Baixo (verde) |
| `Dominio`, `Barra` | Barras de 0 a 100 no semáforo |
| `GraficoLinhas` | Evolução por turma (escola em dourado, turmas em tons de azul, linha da média 6,0) |
| `PorQue` | "Por que estou vendo isso": os dados do alerta |

Tabelas usam a classe `tabela`; botões `btn btn-primario` (marinho), `btn btn-secundario` (branco com borda), `btn btn-ouro`; selos `badge badge-perigo|atencao|sucesso|info|ouro|neutro`; campos `campo`.

## Cores (`app/globals.css`)

| Papel | Token | Valor |
| --- | --- | --- |
| Barra lateral, botão principal, títulos | `marinho` | #143150 |
| Azul das penas (links, foco) | `azul` | #2D6B8D |
| Azul claro | `azul-claro` | #539FBB |
| Destaque (marca, item ativo, faixa) | `ouro` | #DAA241 |
| Fundo | `creme` | #F3EFE4 |
| Risco alto / médio / em dia | `perigo` / `atencao` / `sucesso` | #DC2626 / #D97706 / #16A34A |

Semáforo é o padrão do MUSAR para risco e notas: vermelho abaixo de 6,0 ou domínio abaixo de 50.

## Tipografia e ícones

- Títulos: **Sora** (600). Texto: **DM Sans**. Números com `num` (tabulares).
- Ícones: **lucide-react**, 16–18 px, dourado nos títulos de cartão.

## Indicar professor de reforço

`components/encaminhar.tsx`: mostra primeiro os **sugeridos** (com o motivo e a pontuação) e depois **todos os outros** professores de reforço (especialidades, horários, alunos atuais, taxa de recuperação). Quem decide pode escolher qualquer um. Nunca esconder os não sugeridos.

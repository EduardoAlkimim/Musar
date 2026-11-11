---
name: design-caderno
description: Sistema visual da plataforma ("caderno de escola bem organizado"). Use antes de criar ou alterar qualquer tela, componente, cor, fonte ou animação em apps/web. Evita a cara de "IA barata".
---

# Design "caderno"

A plataforma parece um caderno de escola bem organizado, não um painel de startup de IA.

## Regra de cada tela

1. A tela abre com **uma frase-decisão** em serifa grande: "4 alunos precisam de reforço em frações".
2. Logo abaixo, **uma ação principal** (botão tinta). No máximo uma por tela.
3. A prova vem depois: lista, mapa de calor, gráfico. Gráfico nunca abre a tela.
4. Qualquer tarefa frequente leva no máximo 3 cliques.

## Tokens (apps/web/app/globals.css)

| Papel | Token | Valor |
| --- | --- | --- |
| Papel (fundo) | `--color-papel` | #F5F0E6 |
| Folha (superfície) | `--color-folha` | #FBF8F2 |
| Pauta (linhas, bordas) | `--color-pauta` | #E2D9C8 |
| Grafite (texto 2º) | `--color-grafite` | #5B574F |
| Tinta (texto) | `--color-tinta` | #211F1C |
| Acento único: verde-escola | `--color-escola` | #2D6A4F |
| Alerta real (só isso) | `--color-alerta` | #B23A2E |
| Marca-texto (destaque raro) | `--color-marca` | #F2D774 |

- Vermelho **só** para alerta real. Nunca para decoração ou para "nota baixa".
- Nada de gradiente roxo ou azul, brilho, glassmorphism, ✨, robô ou emoji em título.

## Tipografia

- Títulos: **Newsreader** (serifa editorial), peso 500–600, tracking −0.02em.
- Interface: **Geist** (sans), 16px mínimo no mobile.
- Números: sempre `tabular-nums` (classe `num`). Códigos BNCC em **Geist Mono**.
- Rótulos pequenos em versalete: classe `rotulo` (11–12px, uppercase, tracking +0.08em).

## Componentes de assinatura

- `Pauta`: fundo com linhas de caderno, usado em áreas de leitura (relatórios, resumo dos pais).
- `Margem`: a linha vertical de margem do caderno, em verde-escola, marca a seção ativa.
- `Carimbo`: confirmação de ação (Encaminhado, Aprovado). Gira de −8° para −4°, uma vez. Nada pisca.
- `PorQue`: toda frase de alerta tem um "por que estou vendo isso" que abre os motivos com pontos.
- Mapa de calor: hachura e tons de verde e areia, nunca semáforo verde/amarelo/vermelho.

## Layout

- Professor e coordenação: desktop primeiro, grade editorial assimétrica (coluna principal 7/12 + nota lateral 4/12).
- Pais e aluno: mobile primeiro, uma coluna, cartões como folhas soltas.
- Cartões não são todos iguais: varie o peso (folha, folha com pauta, nota adesiva).

## Movimento

- Uma entrada por tela: frase-decisão aparece, depois a lista com atraso de 60ms por item.
- `prefers-reduced-motion`: sem animação.

## Acessibilidade

Contraste AA (tinta sobre papel 15:1, grafite sobre papel 6.6:1), foco visível em verde-escola com 2px, tudo navegável por teclado, alvos de 44px.

# Trilha — plataforma escolar

Corrige provas, encontra a habilidade de cada aluno que ficou para trás e encaminha para o reforço certo, antes de virar nota baixa.

> Nome provisório. Para trocar, edite `apps/web/lib/marca.ts`.

## Estado atual

Protótipo funcional da Fase 1. As telas e a API rodam com uma **escola de demonstração** (dados fictícios, processados pelas regras reais de correção e alerta). Ainda não há login, gravação no banco nem publicação na nuvem. O que falta está em [docs/requisitos.md](docs/requisitos.md).

## Rodar

```bash
pnpm install
pnpm --filter @escola/web dev     # telas em http://localhost:3000
pnpm --filter @escola/api dev     # API em http://localhost:4000/api
pnpm test                         # domínio + API
```

Banco local (opcional por enquanto): `docker compose up -d`, depois `pnpm --filter @escola/db migrate` e `pnpm --filter @escola/db rls`.

## Onde está cada coisa

| Pasta | O que tem |
| --- | --- |
| `packages/domain` | Regras do produto, sem framework: correção por gabarito, domínio por habilidade, detector de alertas, escolha do professor de reforço, escola de demonstração |
| `apps/web` | Next.js. Telas da professora, prova corrigida, reforço, coordenação, família e aluno |
| `apps/api` | NestJS. Correção, alertas, sugestões de reforço e a camada de IA (Bedrock com fallback e limite por escola) |
| `packages/db` | Prisma: modelo de dados completo e `rls.sql` (isolamento por escola no PostgreSQL) |
| `.claude/skills` | `design-caderno` (sistema visual) e `texto-de-escola` (linguagem). Use antes de mexer em tela ou texto |
| `docs/` | Requisitos atendidos e o que falta |

## Regras que não mudam

- A IA sugere; quem decide é uma pessoa. Nenhuma nota, turma ou reprovação muda sozinha.
- A correção de múltipla escolha é determinística, sem IA.
- Todo alerta mostra "por que estou vendo isso".
- Toda consulta tem escola. A IA nunca recebe nome nem documento do aluno.

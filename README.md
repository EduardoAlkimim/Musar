# Trilha — plataforma escolar

Corrige provas, encontra a habilidade de cada aluno que ficou para trás e encaminha para o reforço certo, antes de virar nota baixa.

> Nome provisório. Para trocar, edite `apps/web/lib/marca.ts`.

## Estado atual

Funciona de ponta a ponta na máquina local, com login real, banco real e isolamento por escola no PostgreSQL. A escola de demonstração vem do seed (dados fictícios). Publicação na nuvem ainda não foi feita. O que falta está em [docs/requisitos.md](docs/requisitos.md).

## Rodar na sua máquina

Precisa de Docker Desktop, Node 24+ e pnpm.

```bash
pnpm install
pnpm preparar    # sobe Postgres, Redis e Keycloak; migra o banco, aplica o RLS e cria a escola de demonstração
pnpm build
pnpm start        # web em http://localhost:3000 · API em http://localhost:4000/api
```

Para desenvolver com recarga automática, use `pnpm dev` no lugar de `pnpm build && pnpm start`.

Copie `apps/web/.env.example` para `apps/web/.env.local` e gere um `SESSION_SECRET` (o arquivo explica como).

### Demonstração guiada (para apresentar)

Abra **http://localhost:3000/demo**. São 7 passos, cerca de 10 minutos: cada passo entra sozinho como a pessoa certa (professora, mãe, reforço, aluno, coordenação, secretaria), abre a tela e mostra numa barra no rodapé o que fazer e o que dizer. Antes de cada apresentação, clique em **Reiniciar os dados**.

Precisa de `DEMO_MODE=1` no `apps/web/.env.local` e na API (`pnpm start` já liga os dois). Nunca ligar em produção: o modo demonstração entra nas contas de teste sem senha.

### Contas de teste

Senha de todas: `trilha-local`. A página inicial mostra atalhos para cada uma.

| Conta | Quem é |
| --- | --- |
| marta@trilha.local | Professora de Matemática do 6º A e B |
| jorge@trilha.local | Professor de Matemática do 6º C e D |
| renato@trilha.local | Professor de reforço |
| luiza@trilha.local | Professora de reforço |
| beatriz@trilha.local | Coordenação pedagógica |
| admin@trilha.local | Secretaria (cadastros e planilhas) e coordenação |
| helena@trilha.local | Mãe do João, 6º B |
| joao@trilha.local | Aluno do 6º B |

Para voltar a escola de demonstração ao estado inicial: `pnpm seed`. Painel do Keycloak: http://localhost:8080 (admin / admin).

## Testes

```bash
pnpm test         # regras do produto e da API
pnpm test:e2e     # fluxo completo contra o banco e o Keycloak locais (refaz o seed)
```

## Onde está cada coisa

| Pasta | O que tem |
| --- | --- |
| `packages/domain` | Regras do produto, sem framework: correção por gabarito, domínio por habilidade, detector de alertas, escolha do professor de reforço |
| `packages/db` | Prisma (modelo de dados), `rls.sql` (isolamento por escola), detector persistido e seed |
| `apps/api` | NestJS: login pelo Keycloak, papéis por escola, rotas de cada perfil e camada de IA (Bedrock com fallback e limite por escola) |
| `apps/web` | Next.js: login OIDC com sessão cifrada e as telas de cada perfil |
| `infra/` | Realm do Keycloak e papel do banco usado pela API |
| `.claude/skills` | `design-caderno` (sistema visual) e `texto-de-escola` (linguagem). Use antes de mexer em tela ou texto |

## Regras que não mudam

- A IA sugere; quem decide é uma pessoa. Nenhuma nota, turma ou reprovação muda sozinha.
- A correção de múltipla escolha é determinística, sem IA.
- Todo alerta mostra "por que estou vendo isso".
- Toda consulta passa pelo RLS da escola. A IA nunca recebe nome nem documento do aluno.
- Responsável aceita o termo (LGPD, art. 14) antes de ver dados ou aprovar reforço.

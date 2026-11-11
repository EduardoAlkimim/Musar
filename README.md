# MUSAR — gestão escolar

Gestão escolar para a direção: visão da escola inteira, alertas de risco de desempenho, turmas, equipe e reforço. A direção (ou a professora) indica o professor de reforço de cada aluno; o MUSAR sugere os mais indicados, mas quem decide pode escolher qualquer um da equipe.

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

Abra **http://localhost:3000/demo**. São 7 passos, cerca de 10 minutos. Cada passo entra sozinho como a pessoa certa, abre a tela e mostra numa barra no rodapé o que fazer e o que dizer:

1. Direção: visão geral da escola
2. Direção: indicar o professor de reforço
3. Professora: turma, mapa e prova corrigida
4. Família: autorizar os dados e aprovar o reforço
5. Professor de reforço: aceitar e agendar
6. Aluno: desempenho e revisão da prova
7. Secretaria: importar a planilha

Antes de cada apresentação, clique em **Reiniciar os dados**. Precisa de `DEMO_MODE=1` no `apps/web/.env.local` e na API (`pnpm start` já liga os dois). Nunca ligar em produção: o modo demonstração entra nas contas de teste sem senha.

### Contas de teste

Senha de todas: `musar-local`. A página de entrada tem atalhos para cada uma.

| Conta | Quem é |
| --- | --- |
| ana@musar.local | Direção |
| beatriz@musar.local | Coordenação pedagógica |
| admin@musar.local | Secretaria (cadastros) e coordenação |
| marta@musar.local | Professora de Matemática do 6º A e B |
| jorge@musar.local | Professor de Matemática do 6º C e D |
| renato@musar.local | Professor de reforço |
| luiza@musar.local | Professora de reforço |
| helena@musar.local | Mãe do João, 6º B |
| joao@musar.local | Aluno do 6º B |

Para voltar a escola de demonstração ao estado inicial: `pnpm seed`. Painel do Keycloak: http://localhost:8080 (admin / admin).

## Testes

```bash
pnpm test         # regras do produto e da API
pnpm test:e2e     # fluxo completo contra o banco e o Keycloak locais (refaz o seed)
```

## Onde está cada coisa

| Pasta | O que tem |
| --- | --- |
| `packages/domain` | Regras do produto, sem framework: correção por gabarito, domínio por habilidade, detector de alertas, sugestão do professor de reforço |
| `packages/db` | Prisma (modelo de dados), `rls.sql` (isolamento por escola), detector persistido e seed |
| `apps/api` | NestJS: login pelo Keycloak, papéis por escola, gestão da direção e rotas de cada perfil, camada de IA (Bedrock com fallback e limite por escola) |
| `apps/web` | Next.js: login OIDC com sessão cifrada e as telas de cada perfil no visual MUSAR |
| `infra/` | Realm e tema de login do Keycloak, papel do banco usado pela API |
| `.claude/skills` | `design-musar` (sistema visual) e `texto-de-escola` (linguagem). Use antes de mexer em tela ou texto |

## Regras que não mudam

- O sistema sugere; quem decide é uma pessoa. Nenhuma nota, turma ou reprovação muda sozinha.
- A correção de múltipla escolha é feita pelo gabarito, sem IA.
- Todo alerta mostra "por que estou vendo isso".
- Toda consulta passa pelo RLS da escola. A IA nunca recebe nome nem documento do aluno.
- Responsável aceita o termo (LGPD, art. 14) antes de ver dados ou aprovar reforço.

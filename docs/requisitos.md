# Requisitos do documento de produto × estado do código

Atualizado em 11/11/2026. Documento de origem: "Plataforma Escolar — Documento de Produto". Tudo abaixo roda na máquina local; a publicação na nuvem vem depois.

## MVP

| Requisito | Estado | Onde |
| --- | --- | --- |
| Correção automática de múltipla escolha pelo gabarito | Feito: criar prova, lançar respostas (digitação rápida), corrigir e recalcular alertas | `/professor/provas`, `POST /api/provas`, `POST /api/provas/:id/respostas` |
| Foto do cartão-resposta | Falta | — |
| Relatório por aluno, questão e habilidade BNCC | Feito | `/professor/provas/:id` |
| Análise de questão: todos erram, não discrimina, em branco, distrator | Feito | `packages/domain/src/grading.ts` |
| Alerta proativo com "por que estou vendo isso" | Feito, persistido; roda ao subir a API e a cada 24 h, e sob demanda pela coordenação | `packages/db/src/detector.ts`, `apps/api/src/detector.job.ts` |
| Mapa de calor alunos × habilidades | Feito | `/professor` |
| Encaminhar ao reforço, top 3 com o porquê | Feito; menor de idade aguarda o responsável | `POST /api/alertas/:id/encaminhar` |
| Fila do reforço, plano, agenda, registro, conclusão | Feito; concluir atualiza o histórico do professor (usado no matching) | `/reforco` |
| Ranking e comparação de turmas e professores, alertas da escola | Feito | `/coordenacao` |
| Pais: acompanhar, aprovar ou recusar reforço, falar com o professor | Feito | `/familia`, `/mensagens` |
| Consentimento LGPD do responsável (data e versão do termo) | Feito; sem termo aceito, nenhum dado do aluno aparece | `POST /api/familia/consentimento` |
| Log de acesso (quem viu qual aluno) | Feito | tabela `access_log` |
| Aluno: próximo passo e revisão do erro | Feito (com o que cada alternativa errada revela) | `/aluno` |
| Gerar questão parecida para revisão | Falta (V2, depende da IA) | — |
| Assistente da aula com citação da fonte (RAG) | Falta: modelo `Chunk` com pgvector pronto, sem ingestão nem busca | — |
| Multiescola isolada | Feito e testado: RLS no PostgreSQL com papel sem BYPASSRLS | `packages/db/prisma/rls.sql` |
| Login (Keycloak, papéis por escola) | Feito: OIDC com PKCE, sessão cifrada, renovação automática | `apps/web/lib/sessao.ts`, `apps/api/src/base.ts` |
| SSO Google/Microsoft e 2FA para coordenação | Falta configurar no Keycloak | — |
| Importação de alunos e turmas por planilha | Feito: confere antes, nada é gravado se houver erro | `/admin` |
| Resumo semanal por WhatsApp/e-mail e notificações | Falta | — |
| Camada de IA trocável, fallback, limite por escola, pseudônimo | Feita e testada com provedor falso; chamada real ao Bedrock não testada (sem credenciais) | `apps/api/src/ia/llm.ts` |

## Testes

- `pnpm test`: 10 testes de regras do produto e 6 da API (rodam no CI).
- `pnpm test:e2e`: 12 testes do fluxo completo contra o banco e o Keycloak locais, incluindo cada recusa de permissão.

## Ambiente

- O Controle de Aplicativo do Windows bloqueia o binário nativo do SWC. A API injeta dependências com `@Inject(TOKEN)` e compila só com esbuild.
- Portas locais: web 3000, API 4000, Keycloak 8080, Postgres 5442 (5432 e 5433 já estavam ocupadas nesta máquina), Redis 6379.
- Infra de nuvem (Terraform, ECS) ainda não foi criada.

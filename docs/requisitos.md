# Requisitos do documento de produto × estado do código

Atualizado em 11/11/2026. Documento de origem: "Plataforma Escolar — Documento de Produto".

## MVP

| Requisito | Estado | Onde |
| --- | --- | --- |
| Correção automática de múltipla escolha (gabarito) | Feito (online). Foto do cartão-resposta: falta | `packages/domain/src/grading.ts`, `POST /api/escolas/:e/provas/:p/correcao` |
| Relatório por aluno, questão e habilidade BNCC | Feito | `/professor/prova` |
| Análise de questão: todos erram / não discrimina / em branco | Feito | `grading.ts` (índice de Kelley, 27%) |
| Distrator: qual confusão cada alternativa revela | Feito | `Question.distractors` |
| Alerta proativo com "por que estou vendo isso" | Feito (regras explicáveis). Worker diário: falta | `detector.ts`, `GET .../alertas` |
| Mapa de calor alunos × habilidades | Feito | `/professor` |
| Indicar reforço em um clique, top 3 com o porquê | Feito na tela; gravação: falta | `matching.ts`, `components/encaminhar.tsx` |
| Fila do reforço, plano sugerido, agenda, registro | Feito na tela; gravação: falta | `/reforco` |
| Ranking e comparação de turmas e professores | Feito | `/coordenacao` |
| Alertas da escola (turma em queda, professor sem lançar) | Feito | `/coordenacao` |
| Pais: acompanhar, aprovar reforço, falar com professor | Feito na tela; envio real: falta | `/familia` |
| Resumo semanal por WhatsApp/e-mail | Falta | — |
| Aluno: próximo passo, revisão do erro com questão parecida | Feito | `/aluno` |
| Assistente da aula com citação da fonte (RAG) | Só a tela de exemplo. Busca vetorial: falta | `Chunk` no schema |
| Multiescola isolada | Schema com `school_id` em tudo + RLS escrito. Testar RLS em banco: falta | `packages/db/prisma/rls.sql` |
| Login (Keycloak, SSO, 2FA) | Falta. Hoje a escola vem da URL da API | — |
| Consentimento LGPD do responsável | Modelo (`GuardianLink`) e texto na tela; fluxo: falta | — |
| Importação por planilha, notificações | Falta | — |
| Camada de IA trocável, fallback, limite por escola, pseudônimo | Feito e testado com provedor falso. Chamada real ao Bedrock: não testada | `apps/api/src/ia/llm.ts` |

## Ambiente

- O Controle de Aplicativo do Windows bloqueia o binário nativo do SWC. A API não usa metadados de decorador; injeta com `@Inject(TOKEN)` e compila só com esbuild.
- Infra (Terraform, ECS, CI) ainda não foi criada.

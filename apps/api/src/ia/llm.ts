import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

/**
 * Camada de IA própria. O resto da API só conhece esta interface:
 * trocar DeepSeek por Qwen ou por um modelo comercial é configuração, não reescrita.
 */
export type Tarefa = "simples" | "chat" | "analise";

export interface PedidoLlm {
  tarefa: Tarefa;
  schoolId: string;
  sistema: string;
  mensagem: string;
  maxTokens?: number;
}

export interface RespostaLlm {
  texto: string;
  modelo: string;
  tokensEntrada: number;
  tokensSaida: number;
}

export interface ProvedorLlm {
  gerar(pedido: PedidoLlm, modelo: string): Promise<RespostaLlm>;
}

export const LLM = Symbol("Llm");

export interface ConfigLlm {
  modelos: Record<Tarefa, string>;
  fallback: string;
  /** Limite diário de chamadas por escola. */
  limiteDiarioPorEscola: number;
}

export function configDoAmbiente(env = process.env): ConfigLlm {
  const simples = env.LLM_MODEL_SIMPLE ?? "deepseek.v3-2";
  return {
    modelos: { simples, chat: env.LLM_MODEL_CHAT ?? simples, analise: env.LLM_MODEL_ANALYSIS ?? env.LLM_MODEL_CHAT ?? simples },
    fallback: env.LLM_FALLBACK_MODEL ?? "qwen.qwen3-32b",
    limiteDiarioPorEscola: Number(env.LLM_DAILY_LIMIT_PER_SCHOOL ?? 2000),
  };
}

/** AWS Bedrock (Converse API). Dados ficam na conta AWS da empresa, sem uso para treino. */
export class ProvedorBedrock implements ProvedorLlm {
  constructor(private readonly cliente = new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? "sa-east-1" })) {}

  async gerar(p: PedidoLlm, modelo: string): Promise<RespostaLlm> {
    const r = await this.cliente.send(
      new ConverseCommand({
        modelId: modelo,
        system: [{ text: p.sistema }],
        messages: [{ role: "user", content: [{ text: p.mensagem }] }],
        inferenceConfig: { maxTokens: p.maxTokens ?? 800, temperature: 0.2 },
      }),
    );
    const texto = r.output?.message?.content?.map((c) => c.text ?? "").join("") ?? "";
    return { texto, modelo, tokensEntrada: r.usage?.inputTokens ?? 0, tokensSaida: r.usage?.outputTokens ?? 0 };
  }
}

export class LimiteDeUsoAtingido extends Error {}

/**
 * Orquestra modelo por tarefa, fallback automático e limite por escola.
 * O contador fica em memória aqui; em produção vai para o Redis (ElastiCache).
 */
export class CamadaLlm {
  private uso = new Map<string, number>();

  constructor(
    private readonly provedor: ProvedorLlm,
    private readonly config: ConfigLlm,
    private readonly hoje = () => new Date().toISOString().slice(0, 10),
  ) {}

  async gerar(p: PedidoLlm): Promise<RespostaLlm> {
    const chave = `${p.schoolId}:${this.hoje()}`;
    const usado = this.uso.get(chave) ?? 0;
    if (usado >= this.config.limiteDiarioPorEscola) throw new LimiteDeUsoAtingido("Limite diário de IA da escola atingido");
    this.uso.set(chave, usado + 1);

    const mensagem = pseudonimizar(p.mensagem);
    try {
      return await this.provedor.gerar({ ...p, mensagem }, this.config.modelos[p.tarefa]);
    } catch {
      return this.provedor.gerar({ ...p, mensagem }, this.config.fallback);
    }
  }
}

/**
 * A IA nunca recebe nome nem documento do aluno (LGPD, art. 14).
 * Remove CPF, e-mail e telefone; nomes devem chegar já trocados por pseudônimo ("Aluno 7").
 */
export function pseudonimizar(texto: string): string {
  return texto
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[documento]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[e-mail]")
    .replace(/(\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b/g, "[telefone]");
}

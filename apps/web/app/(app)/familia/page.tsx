import type { Metadata } from "next";
import type { AlertReason } from "@escola/domain";
import { Pagina, PorQue } from "@/components/caderno";
import { Confirmar } from "@/components/confirmar";
import { Decidir } from "@/components/decidir";
import { NovaMensagem } from "@/components/mensagem";
import { api } from "@/lib/api";
import { dataCurta, decimal, pct } from "@/lib/formato";
import { aprovarReforco, consentir, recusarReforco } from "../acoes";

export const metadata: Metadata = { title: "Resumo da semana" };

type Filho =
  | { id: string; nome: string; precisaConsentimento: true; versaoTermo: string }
  | {
      id: string;
      nome: string;
      precisaConsentimento: false;
      turma?: string;
      consentimentoEm: string;
      versaoTermo: string;
      frequencia: number;
      alertas: { frase: string; habilidade: string; codigo: string; status: string; motivos: AlertReason[] }[];
      reforcos: { id: string; status: string; habilidade: string; tutor: string; horarios: string[]; plano: { sessoes?: number }; proximaSessao: string | null }[];
      vaiBemEm: string[];
      notas: { titulo: string; materia: string; data: string; nota: number }[];
      professores: { id: string; nome: string; materia: string }[];
    };

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export default async function Familia() {
  const { responsavel, filhos } = await api<{ responsavel: string; filhos: Filho[] }>("/familia");
  const primeiro = responsavel.split(" ")[0];

  return (
    <Pagina className="max-w-[34rem]">
      {filhos.length === 0 && <p className="text-grafite">Nenhum aluno vinculado a você. Fale com a secretaria da escola.</p>}
      {filhos.map((f) =>
        f.precisaConsentimento ? (
          <section key={f.id} className="entra" aria-labelledby={`termo-${f.id}`}>
            <p className="rotulo">Olá, {primeiro} · primeiro acesso</p>
            <h1 id={`termo-${f.id}`} className="mt-4 text-[2.2rem]">Antes de ver os dados de {f.nome.split(" ")[0]}, precisamos da sua autorização.</h1>
            <div className="pauta mt-6 px-5 text-[0.98rem]">
              <p>A escola usa a plataforma para acompanhar notas, frequência e habilidades.</p>
              <p>Quem vê: você, os professores da turma e a coordenação.</p>
              <p>A IA nunca recebe o nome nem documentos do aluno.</p>
              <p>Você pode pedir a exportação ou a exclusão dos dados quando quiser.</p>
              <p className="text-grafite">Termo {f.versaoTermo} · LGPD, art. 14</p>
            </div>
            <div className="mt-6">
              <Confirmar rotulo="Li e autorizo" carimbo="Autorizado" acao={consentir.bind(null, f.id, f.versaoTermo)} />
            </div>
          </section>
        ) : (
          <Resumo key={f.id} f={f} primeiro={primeiro ?? ""} />
        ),
      )}
    </Pagina>
  );
}

function Resumo({ f, primeiro }: { f: Extract<Filho, { precisaConsentimento: false }>; primeiro: string }) {
  const nome = f.nome.split(" ")[0]!;
  const alerta = f.alertas[0];
  const pendente = f.reforcos.find((r) => r.status === "AGUARDANDO_RESPONSAVEL");
  const andamento = f.reforcos.find((r) => r.status !== "AGUARDANDO_RESPONSAVEL");
  const mat = f.professores.find((p) => p.materia === "Matemática");

  return (
    <article className="mb-16">
      <p className="rotulo entra">Olá, {primeiro} · {f.turma}</p>
      <h1 className="entra mt-4 text-[2.4rem]">{alerta ? `${alerta.frase}.` : `${nome} está indo bem.`}</h1>
      {alerta && (
        <div className="entra mt-3 text-[1.05rem] text-grafite">
          <PorQue motivos={alerta.motivos} score={0} pontos={false} />
        </div>
      )}

      {pendente && (
        <div className="folha entra mt-7 p-5">
          <p className="font-semibold">Reforço em {pendente.habilidade} com {pendente.tutor}</p>
          <p className="text-sm text-grafite">
            {pendente.plano.sessoes} sessões de 50 minutos, com mini-avaliação no fim{pendente.horarios.length ? ` · horários: ${pendente.horarios.join(", ")}` : ""}
          </p>
          <div className="mt-4">
            <Decidir
              sim={{ rotulo: "Aprovar o reforço", carimbo: "Aprovado", depois: `${pendente.tutor.split(" ")[0]} vai marcar a primeira sessão.`, acao: aprovarReforco.bind(null, pendente.id) }}
              nao={{ rotulo: "Agora não", carimbo: "Recusado", depois: "A professora vai combinar outro caminho.", acao: recusarReforco.bind(null, pendente.id), confirmar: "Recusar o reforço? A professora será avisada." }}
            />
          </div>
        </div>
      )}
      {andamento && (
        <div className="folha mt-7 p-5">
          <p className="font-semibold">Reforço em {andamento.habilidade} com {andamento.tutor}</p>
          <p className="text-sm text-grafite">{andamento.proximaSessao ? `Próxima sessão: ${quando(andamento.proximaSessao)}` : "Aprovado. A primeira sessão será marcada em breve."}</p>
        </div>
      )}

      <section className="mt-12" aria-labelledby={`semana-${f.id}`}>
        <h2 id={`semana-${f.id}`} className="text-[1.45rem]">A semana de {nome}</h2>
        <dl className="pauta mt-3 px-5 py-1">
          <div className="flex justify-between"><dt>Frequência (45 dias)</dt><dd className="num font-mono">{pct(f.frequencia)}</dd></div>
          {f.notas.map((n) => (
            <div key={n.titulo + n.materia} className="flex justify-between gap-4"><dt className="truncate">{n.materia} · {dataCurta(n.data.slice(0, 10))}</dt><dd className="num shrink-0 font-mono">{decimal(n.nota)} de 10</dd></div>
          ))}
          {f.vaiBemEm.length > 0 && <div><dt>Vai bem em</dt><dd className="font-serif text-[1.1rem] italic">{f.vaiBemEm.join(" e ")}</dd></div>}
        </dl>
      </section>

      {f.professores.length > 0 && (
        <section className="mt-12" aria-labelledby={`msg-${f.id}`}>
          <h2 id={`msg-${f.id}`} className="text-[1.45rem]">Falar com {mat ? `a professora ${mat.nome.split(" ")[0]}` : "os professores"}</h2>
          <div className="mt-3">
            <NovaMensagem alunoId={f.id} destinatarios={[...(mat ? [mat] : []), ...f.professores.filter((p) => p !== mat)].map((p) => ({ id: p.id, nome: p.nome, detalhe: p.materia }))} />
          </div>
        </section>
      )}

      <p className="mt-12 text-xs text-grafite">
        Você autorizou o uso dos dados escolares de {nome} em {new Date(f.consentimentoEm).toLocaleDateString("pt-BR")} (termo {f.versaoTermo}). Pode pedir a exportação ou a exclusão a qualquer momento pela secretaria.
      </p>
    </article>
  );
}

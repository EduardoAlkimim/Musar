import type { Metadata } from "next";
import { BookOpen, CalendarCheck, LifeBuoy, MessageSquare, ShieldCheck } from "lucide-react";
import type { AlertReason } from "@escola/domain";
import { Card, Pagina, PorQue } from "@/components/ui";
import { Confirmar } from "@/components/confirmar";
import { Decidir } from "@/components/decidir";
import { NovaMensagem } from "@/components/mensagem";
import { api } from "@/lib/api";
import { dataCurta, decimal, pct, quando } from "@/lib/formato";

export const metadata: Metadata = { title: "Acompanhamento" };

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

export default async function Familia() {
  const { responsavel, filhos } = await api<{ responsavel: string; filhos: Filho[] }>("/familia");
  const primeiro = responsavel.split(" ")[0] ?? "";

  return (
    <Pagina className="max-w-[44rem]">
      {filhos.length === 0 && <p className="text-suave">Nenhum aluno vinculado a você. Fale com a secretaria da escola.</p>}
      {filhos.map((f) =>
        f.precisaConsentimento ? (
          <section key={f.id} data-demo="familia" className="card entra p-6 sm:p-7" aria-labelledby={`termo-${f.id}`}>
            <span className="grid size-10 place-items-center rounded-[10px] bg-azul-fundo text-azul"><ShieldCheck className="size-5" /></span>
            <p className="rotulo mt-4">Olá, {primeiro} · primeiro acesso</p>
            <h1 id={`termo-${f.id}`} className="mt-1 text-[1.45rem] font-semibold">Antes de ver os dados de {f.nome.split(" ")[0]}, precisamos da sua autorização.</h1>
            <ul className="mt-5 space-y-2 rounded-[12px] bg-[#f7fafc] p-4 text-[0.95rem]">
              <li>A escola usa o MUSAR para acompanhar notas, frequência e habilidades.</li>
              <li>Quem vê: você, os professores da turma e a direção.</li>
              <li>A IA nunca recebe o nome nem documentos do aluno.</li>
              <li>Você pode pedir a exportação ou a exclusão dos dados quando quiser.</li>
              <li className="text-xs text-suave">Termo {f.versaoTermo} · LGPD, art. 14</li>
            </ul>
            <div className="mt-6">
              <Confirmar rotulo="Li e autorizo" carimbo="Autorizado" acao={{ nome: "consentir", args: [f.id, f.versaoTermo] }} />
            </div>
          </section>
        ) : (
          <Resumo key={f.id} f={f} primeiro={primeiro} />
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
    <article data-demo="familia" className="space-y-4">
      <section className="card entra relative overflow-hidden p-6">
        <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${alerta ? "bg-perigo" : "bg-sucesso"}`} />
        <p className="rotulo">Olá, {primeiro} · {f.nome} · {f.turma}</p>
        <h1 className="mt-1 text-[1.45rem] font-semibold">{alerta ? `${alerta.frase}.` : `${nome} está indo bem.`}</h1>
        {alerta && <div className="mt-3"><PorQue motivos={alerta.motivos} score={0} pontos={false} /></div>}
      </section>

      {pendente && (
        <Card titulo={`Reforço em ${pendente.habilidade}`} icone={LifeBuoy}>
          <p>Com <strong>{pendente.tutor}</strong>, {pendente.plano.sessoes} sessões de 50 minutos e mini-avaliação no fim.</p>
          {pendente.horarios.length > 0 && <p className="mt-1 text-sm text-suave">Horários: {pendente.horarios.join(", ")}</p>}
          <div className="mt-4">
            <Decidir
              sim={{ rotulo: "Aprovar o reforço", carimbo: "Aprovado", depois: `${pendente.tutor.split(" ")[0]} vai marcar a primeira sessão.`, acao: { nome: "aprovarReforco", args: [pendente.id] } }}
              nao={{ rotulo: "Agora não", carimbo: "Recusado", depois: "A escola vai combinar outro caminho.", acao: { nome: "recusarReforco", args: [pendente.id] }, confirmar: "Recusar o reforço? A escola será avisada." }}
            />
          </div>
        </Card>
      )}
      {andamento && (
        <Card titulo={`Reforço em ${andamento.habilidade}`} icone={LifeBuoy}>
          <p>Com <strong>{andamento.tutor}</strong>.</p>
          <p className="mt-1 text-sm text-suave">{andamento.proximaSessao ? `Próxima sessão: ${quando(andamento.proximaSessao)}` : "Aprovado. A primeira sessão será marcada em breve."}</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card titulo="Notas recentes" icone={BookOpen}>
          {f.notas.length === 0 ? <p className="text-sm text-suave">Nenhuma prova lançada ainda.</p> : (
            <ul className="-my-1 divide-y divide-[#eef2f5]">
              {f.notas.map((n) => (
                <li key={n.titulo + n.materia} className="flex items-baseline justify-between gap-3 py-2">
                  <span>{n.materia}<span className="block text-xs text-suave">{dataCurta(n.data)}</span></span>
                  <span className={`num font-titulo text-lg font-semibold ${n.nota < 6 ? "text-perigo" : "text-marinho"}`}>{decimal(n.nota)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card titulo="Frequência" icone={CalendarCheck}>
          <p className={`num font-titulo text-[2rem] font-semibold ${f.frequencia < 0.85 ? "text-atencao" : "text-sucesso"}`}>{pct(f.frequencia)}</p>
          <p className="text-sm text-suave">nos últimos 45 dias</p>
          {f.vaiBemEm.length > 0 && <p className="mt-4 text-sm">Vai bem em <strong>{f.vaiBemEm.join(" e ")}</strong>.</p>}
        </Card>
      </div>

      {f.professores.length > 0 && (
        <Card titulo={`Falar com ${mat ? `a professora ${mat.nome.split(" ")[0]}` : "os professores"}`} icone={MessageSquare}>
          <NovaMensagem alunoId={f.id} destinatarios={[...(mat ? [mat] : []), ...f.professores.filter((p) => p !== mat)].map((p) => ({ id: p.id, nome: p.nome, detalhe: p.materia }))} />
        </Card>
      )}

      <p className="text-xs text-suave">
        Você autorizou o uso dos dados escolares de {nome} em {new Date(f.consentimentoEm).toLocaleDateString("pt-BR")} (termo {f.versaoTermo}). Pode pedir a exportação ou a exclusão a qualquer momento pela secretaria.
      </p>
    </article>
  );
}

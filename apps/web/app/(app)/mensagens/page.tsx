import type { Metadata } from "next";
import clsx from "clsx";
import { Decisao, Pagina } from "@/components/caderno";
import { Confirmar } from "@/components/confirmar";
import { NovaMensagem } from "@/components/mensagem";
import { api } from "@/lib/api";
import { marcarLida } from "../acoes";

export const metadata: Metadata = { title: "Mensagens" };

interface Msg {
  id: string;
  de: { id: string; nome?: string };
  para: { id: string; nome?: string };
  aluno: { id: string; nome?: string };
  texto: string;
  recebida: boolean;
  lidaEm: string | null;
  em: string;
}

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export default async function Mensagens() {
  const ms = await api<Msg[]>("/mensagens");
  const naoLidas = ms.filter((m) => m.recebida && !m.lidaEm);
  // Uma conversa por aluno + outra pessoa.
  const conversas = new Map<string, Msg[]>();
  for (const m of ms) {
    const outro = m.recebida ? m.de : m.para;
    const k = `${m.aluno.id}|${outro.id}`;
    conversas.set(k, [...(conversas.get(k) ?? []), m]);
  }

  return (
    <Pagina className="max-w-[46rem]">
      <Decisao sobre="Mensagens" frase={naoLidas.length ? `${naoLidas.length} mensage${naoLidas.length > 1 ? "ns" : "m"} esperando resposta.` : "Nenhuma mensagem nova."} />
      <div className="mt-12 space-y-8">
        {[...conversas.entries()].map(([chave, c]) => {
          const m0 = c[0]!;
          const outro = m0.recebida ? m0.de : m0.para;
          return (
            <section key={chave} className="folha p-6" aria-label={`Conversa com ${outro.nome} sobre ${m0.aluno.nome}`}>
              <p className="rotulo">Sobre {m0.aluno.nome}</p>
              <h2 className="mt-1 text-[1.35rem]">{outro.nome}</h2>
              <ol className="mt-4 space-y-3">
                {[...c].reverse().map((m) => (
                  <li key={m.id} className={clsx("max-w-[85%] rounded-[3px] px-4 py-3", m.recebida ? "bg-papel" : "ml-auto bg-escola-claro")}>
                    <p>{m.texto}</p>
                    <p className="mt-1 font-mono text-[0.7rem] text-grafite">{m.recebida ? m.de.nome?.split(" ")[0] : "Você"} · {quando(m.em)}</p>
                    {m.recebida && !m.lidaEm && <div className="mt-2"><Confirmar rotulo="Marcar como lida" carimbo="Lida" variante="linha" acao={marcarLida.bind(null, m.id)} /></div>}
                  </li>
                ))}
              </ol>
              <div className="mt-5">
                <NovaMensagem alunoId={m0.aluno.id} destinatarios={[{ id: outro.id, nome: outro.nome ?? "" }]} rotulo="Responder" />
              </div>
            </section>
          );
        })}
      </div>
    </Pagina>
  );
}

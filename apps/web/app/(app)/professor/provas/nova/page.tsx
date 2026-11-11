import type { Metadata } from "next";
import { Decisao, Pagina } from "@/components/caderno";
import { NovaProva } from "@/components/nova-prova";
import { api } from "@/lib/api";
import type { Atribuicoes } from "../page";

export const metadata: Metadata = { title: "Nova prova" };

export default async function Nova() {
  const a = await api<Atribuicoes>("/professor/atribuicoes");
  return (
    <Pagina>
      <Decisao sobre="Nova prova" frase="Uma questão por linha: habilidade e gabarito." detalhe="As alternativas e o que cada erro revela são opcionais, mas deixam o relatório muito mais útil." />
      <div className="mt-12">
        <NovaProva atribuicoes={a.atribuicoes} />
      </div>
    </Pagina>
  );
}

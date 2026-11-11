import { Cabecalho } from "@/components/cabecalho";

export default function LayoutPerfis({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecalho />
      {children}
    </>
  );
}

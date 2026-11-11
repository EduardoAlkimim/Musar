import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { MARCA } from "@/lib/marca";
import "./globals.css";

const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", style: ["normal", "italic"], axes: ["opsz"] });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: { default: MARCA, template: `%s · ${MARCA}` },
  description: "Corrige provas, encontra a lacuna de cada aluno e encaminha para o reforço certo.",
};

export const viewport: Viewport = { themeColor: "#f5f0e6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${newsreader.variable} ${geist.variable} ${geistMono.variable}`}>
      <body>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}

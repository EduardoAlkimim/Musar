import type { Metadata, Viewport } from "next";
import { DM_Sans, Sora } from "next/font/google";
import { MARCA, SLOGAN } from "@/lib/marca";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "500", "600", "700"] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: { default: `${MARCA} — ${SLOGAN}`, template: `%s · ${MARCA}` },
  description: "Gestão escolar com acompanhamento de desempenho e reforço.",
  icons: { icon: "/arara.png" },
};

export const viewport: Viewport = { themeColor: "#143150" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}

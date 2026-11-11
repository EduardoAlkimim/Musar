import type { NextConfig } from "next";

/** Versão estática da demonstração (GitHub Pages): HTML puro, servido em /<repositório>. */
const base = process.env.BASE_PATH ?? "";

const config: NextConfig = {
  output: "export",
  basePath: base,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: base, NEXT_PUBLIC_ESTATICO: "1" },
  transpilePackages: ["@escola/domain"],
  // Os tipos são verificados no projeto original; aqui só montamos o HTML.
  typescript: { ignoreBuildErrors: true },
};

export default config;

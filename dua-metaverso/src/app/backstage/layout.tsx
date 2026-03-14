import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DUA Backstage — Painel de Controlo",
  description: "Host control panel — DUA Metaverso da Lua",
  robots: "noindex,nofollow",
};

export default function BackstageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata, Viewport } from "next";
import { Orbitron, Montserrat } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#030305",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "DUA Metaverso da Lua — Primeiro Concerto com DJ Avatar IA ao Vivo",
  description:
    "Entra no primeiro concerto de IA lusófona ao vivo no metaverso. Pede músicas à DUA IA em Português e Crioulo, participa na sala ao vivo, e vive uma experiência cósmica imersiva com DJ Avatar 3D. Construído por ESTRACA • 2 Lados Ecossistema.",
  keywords: [
    "DUA", "Metaverso", "Lua", "Concerto IA", "DJ Avatar", "Lusófona",
    "Música IA", "Crioulo", "Português", "ESTRACA", "2 Lados", "KYNTAL",
    "LiveKit", "WebRTC", "Three.js", "Metaverse Concert",
  ],
  openGraph: {
    title: "DUA Metaverso da Lua — Concerto IA Lusófona com DJ Avatar ao Vivo",
    description: "O primeiro concerto de IA lusófona ao vivo no metaverso com DJ Avatar 3D.",
    type: "website",
    locale: "pt_PT",
    siteName: "DUA Metaverso da Lua",
  },
  twitter: {
    card: "summary_large_image",
    title: "DUA Metaverso da Lua — Concerto IA com DJ Avatar",
    description: "O primeiro concerto de IA lusófona ao vivo no metaverso.",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_LIVEKIT_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_LIVEKIT_URL} />
        )}
        <link rel="dns-prefetch" href="https://dua.2lados.pt" />
      </head>
      <body
        className={`${orbitron.variable} ${montserrat.variable} font-sans antialiased bg-[#030305] text-[#e8e8e8]`}
      >
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center", color: "#e8e8e8", background: "#030305", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>DUA Metaverso da Lua</h1>
            <p>A experiencia interactiva requer JavaScript activado.</p>
            <a href="https://dua.2lados.pt" style={{ color: "#00ffcc", textDecoration: "underline" }}>Visitar dua.2lados.pt</a>
          </div>
        </noscript>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){});}`,
          }}
        />
      </body>
    </html>
  );
}

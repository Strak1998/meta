import type { Metadata, Viewport } from "next";
import "./globals.css";

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
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Montserrat:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[#030305] text-[#e8e8e8]">
        {children}
      </body>
    </html>
  );
}

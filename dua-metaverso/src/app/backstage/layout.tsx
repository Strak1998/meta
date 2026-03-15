import type { Metadata } from "next";
export const metadata: Metadata = { title: "DUA Backstage", robots: "noindex,nofollow" };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }

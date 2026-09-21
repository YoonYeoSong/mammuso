import type { Metadata } from "next";
import "./globals.css";
import "./pixel-clay.css";
import "./retro-ui.css";
export const metadata: Metadata = { title: "맘무소 | 오늘의 마음 놀이방", description: "꿈과 타로로 오늘의 마음을 가볍고 다정하게 들여다보는 맘무소" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }

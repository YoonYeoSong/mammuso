import type { Metadata } from "next";
import "./globals.css";
import "./pixel-clay.css";
import "./retro-ui.css";
import "./tarot-ui.css";
import "./destiny-tarot.css";
export const metadata: Metadata = { title: "운명타로 | DESTINY TAROT", description: "달빛이 스며드는 밤, 당신의 이야기를 만나는 운명타로" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }

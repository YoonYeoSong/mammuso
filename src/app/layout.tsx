import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./pixel-clay.css";
import "./retro-ui.css";
import "./tarot-ui.css";
import "./destiny-tarot.css";
import "./today-tarot.css";
import { MobileFloatingNavigation } from "@/components/destiny-tarot/MobileFloatingNavigation";

const maruBuri = localFont({
  src: [
    { path: "./fonts/MaruBuri-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/MaruBuri-SemiBold.otf", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-maru-buri",
});

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  style: "normal",
  display: "swap",
  variable: "--font-pretendard",
});

export const metadata: Metadata = { title: "운명타로 | DESTINY TAROT", description: "달빛이 스며드는 밤, 당신의 이야기를 만나는 운명타로" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko" className={`${maruBuri.variable} ${pretendard.variable}`}><body>{children}<MobileFloatingNavigation /></body></html>; }

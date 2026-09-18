import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "타로킹 | AI 타로", description: "궁금한 것을 가볍고 재미있게 카드로 들여다보는 AI 타로 콘텐츠" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }

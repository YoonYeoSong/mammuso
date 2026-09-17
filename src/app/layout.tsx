import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "맛만볼까? | AI 점 놀이", description: "궁금한 것을 가볍고 재미있게 점쳐보는 AI 콘텐츠" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }

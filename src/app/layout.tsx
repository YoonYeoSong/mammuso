import type { Metadata } from "next";
import "./globals.css";
import "./stamp.css";
export const metadata: Metadata = { title: "맘무소 | 마음 민원 접수처", description: "혼자 처리하기 어려운 마음을 접수해드립니다." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }

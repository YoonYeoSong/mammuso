import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오늘의 타로 | 운명타로",
  description: "오늘의 흐름과 내가 선택한 타로 카드 한 장을 함께 읽어보세요.",
};

export default function TodayTarotLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

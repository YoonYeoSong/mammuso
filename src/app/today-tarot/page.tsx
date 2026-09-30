import { TodayTarotIntro } from "@/components/today-tarot/TodayTarotIntro";

export default async function TodayTarotPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const { start } = await searchParams;
  return <TodayTarotIntro openStart={start === "1"} />;
}

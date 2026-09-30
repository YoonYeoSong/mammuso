import { TodayTarotReveal } from "@/components/today-tarot/TodayTarotReveal";

export default async function TodayTarotRevealPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return <TodayTarotReveal clarifierMode={mode === "clarifier"} />;
}

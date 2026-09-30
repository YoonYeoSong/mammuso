import { TodayTarotSelection } from "@/components/today-tarot/TodayTarotSelection";

export default async function TodayTarotSelectionPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return <TodayTarotSelection clarifierMode={mode === "clarifier"} />;
}

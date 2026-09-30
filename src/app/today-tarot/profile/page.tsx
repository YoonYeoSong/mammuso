import { TodayTarotProfileForm } from "@/components/today-tarot/TodayTarotProfileForm";

export default async function TodayTarotProfilePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return <TodayTarotProfileForm mode={mode === "member" ? "member" : "guest"} />;
}

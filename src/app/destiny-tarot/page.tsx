import { DestinyTarotExperience } from "@/components/destiny-tarot/DestinyTarotExperience";
import { isDestinyReadingType } from "@/lib/destiny-tarot/profiles";

export default async function DestinyTarotPage({ searchParams }: { searchParams: Promise<{ readingType?: string | string[] }> }) {
  const { readingType } = await searchParams;
  return <DestinyTarotExperience readingType={isDestinyReadingType(readingType) ? readingType : "general"} />;
}

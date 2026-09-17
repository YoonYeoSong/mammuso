import Link from "next/link";
import { TarotExperience } from "@/components/TarotExperience";
import { brand } from "@/lib/brand";

export default function TarotPage() {
  return <main className="tarot-page"><header className="tarot-header"><Link href="/" aria-label="홈으로">←</Link><Link href="/" className="new-brand">{brand.name}</Link><span>FREE TAROT</span></header><TarotExperience /></main>;
}

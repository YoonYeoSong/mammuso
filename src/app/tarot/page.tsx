import Link from "next/link";
import { TarotExperience } from "@/components/TarotExperience";

export default function TarotPage() {
  return <main className="tarot-page"><header className="tarot-header"><Link href="/" aria-label="홈으로">←</Link><span>FREE TAROT</span></header><TarotExperience /></main>;
}

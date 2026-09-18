import Link from "next/link";
import { DreamExperience } from "@/components/DreamExperience";

export const metadata = { title: "꿈값 | 타로킹", description: "어젯밤 꾼 꿈을 가볍게 감정해 보는 AI 콘텐츠" };

export default function DreamPage() {
  return <main className="dream-page"><header className="tarot-header"><Link href="/" aria-label="홈으로">←</Link><span>FREE DREAM VALUE</span></header><DreamExperience /></main>;
}

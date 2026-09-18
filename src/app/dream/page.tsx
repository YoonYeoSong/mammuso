import Link from "next/link";
import { DreamExperience } from "@/components/DreamExperience";

export const metadata = { title: "꿈 한 장면 | 타로킹", description: "어젯밤 꾼 꿈을 한 장면 카드와 풀이로 정리해 보는 AI 콘텐츠" };

export default function DreamPage() {
  return <main className="dream-page"><header className="tarot-header"><Link href="/" aria-label="홈으로">←</Link><span>FREE DREAM SCENE</span></header><DreamExperience /></main>;
}
